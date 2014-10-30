#pragma strict
#pragma implicit
#pragma downcast
//
//	Level of Detail (LOD) for Unity3D 2.6.1.
//	by Junichi Fukuhara 2010
//	http://www.macroseed.com
//
//	Original Algorithm :
//	Progressive Mesh type Polygon Reduction Algorithm
//	by Stan Melax (c) 1998
//	http://www.melax.com/polychop/
//
//	Update :
//	2010.06.04
// 		created.
//
//	LIMITATION
//	Maximum number of vertices allowed.
//	65,535 vertices. (Unity3D 2.6.1 limitation)
//
import System.Array;

class LODSystemEditor
{
	
	public var ratio				: float = 0.5;
	public var smoothAngle	: float = 45.0;
	private var smoothAngleDot : float;
	public var lockSelPoint	: boolean = true;
	public var selectedVertices : Array = new Array();
	public var bRecalculateNormals : boolean;
	
	private var time_s : float; // for debug
	public var lodDataSize : float = 0;
	
	private var myComparer : IComparer;
	
	private var targetMesh : Mesh;
	private var myTriangles	: LODTriangle[];	// LODTriangle クラスを格納
	private var myLODVertices	: LODVertex[];		// LODVertex クラスを格納
	private var collapseHistory : LODHistory[];
	private var cache : LODVertex[];
	private var cacheSize : int;
	private var triOrder : int[];
	
	private var originalTriangles	: int[];
	private var originalVertices	: Vector3[];
	private var originalUVs				: Vector2[];
	private var originalNormals		: Vector3[];
	//private var originalTangents		: Vector4[];
	
	private var sharedTriangles	: int[];
	private var sharedVertices		: Vector3[];
	
	public var finalVertices		: Vector3[];
	public var finalNormals		: Vector3[];
	public var finalUVs				: Vector2[];
	public var finalTriangles	: int[];
	
	public var preCalculateDone : boolean = false;
	public var lastTarget	: int;
	
	private var currentcnt : int;
	private var searchIndex : int;
	
	
	private function ComputeEdgeCollapseCosts( u : LODVertex, v : LODVertex ) : float
	{
    var i : ushort;
    var j : ushort;
    var faceU : LODTriangle;
    var faceV : LODTriangle;
    
    var edgelength : float = (v.position - u.position).sqrMagnitude;
    var cost : float = 0;
    
    // find the "vFaces" triangles that are on the edge uv
    var vFaces : Array = new Array();
    var uFaceCount : ushort = u.face.length;
    for (i = 0; i < uFaceCount; ++i) {
			faceU = u.face[i];
			if (faceU.HasVertex( v )) {
				vFaces.Push( faceU );
			}
		}
		
		// 頂点 u を含むフェイスの一番外を向いているものを探す
		// use the triangle facing most away from the sides 
		// to determine our curvature term
    var vFaceCount : ushort = vFaces.length;
    for (i = 0; i < uFaceCount; ++i) {
			var mindot : float = 1; // curve for face i and closer side to it
			faceU = u.face[i];
			var faceN : Vector3 = faceU.normal;
			for (j = 0; j < vFaceCount; ++j) {
				// use dot product of face normals. '^' defined in vector
				faceV = vFaces[j];
				var ns : Vector3 = faceV.normal;
				var dot : float = (1-(faceN.x*ns.x + faceN.y*ns.y + faceN.z*ns.z))*0.5;
				if (dot < mindot) mindot = dot;
			}
			if (mindot > cost) cost = mindot;
    }
    
		if (u.IsBorder() && vFaceCount > 1)
			cost = 1.0;
    
    // texture UV check
    // if neighbor face has different uv
    // means that shouldn't be collapsed.
    // set its priority as higher cost.
		var found : ushort = 0;
		for (i = 0; i < uFaceCount; ++i) {
			faceU = u.face[i];
			var uv : Vector2 = faceU.uvAt( u );
			for (j = 0; j < vFaceCount; ++j) {
				faceV = vFaces[j];
				if (uv == faceV.uvAt( u )) break;
			}
			if (j == vFaceCount)
				++found;
		}
		// all neighbor faces share same uv
		// so set u as higher cost.
		if (found) cost = 1.0;
		
		if (u.selected && lockSelPoint)
			cost = 6553.5;
		
		// the more coplanar the lower the curvature term
		// cost 0 means u and v are on the same plane.
		return edgelength * cost;
	};
	
	
	private function ComputeEdgeCostAtVertex( v : LODVertex ) : void
	{
		// compute the edge collapse cost for all edges that start
		// from vertex v.  Since we are only interested in reducing
		// the object by selecting the min cost edge at each step, we
		// only cache the cost of the least cost edge at this vertex
		// (in member variable collapse) as well as the value of the 
		// cost (in member variable cost).
		if (v.neighbor.length == 0) {
			// v doesn't have neighbors so it costs nothing to collapse
			v.collapse = null;
			v.cost = 0;//-0.01;
			return;
		}
		v.cost = 65535;
		v.collapse = null;
		// search all neighboring edges for "least cost" edge
		var neighborCount : ushort = v.neighbor.length;
		var cost : float;
		for (var i : ushort = 0; i < neighborCount; ++i) {
			cost = ComputeEdgeCollapseCosts( v, v.neighbor[i] );
			if (cost < v.cost) {
				v.collapse = v.neighbor[i];	// candidate for edge collapse
				v.cost = cost;						// cost of the collapse
			}
		}
	};
	
	
	private function ComputeAllEdgeCollapseCosts() : void
	{
		// For all the edges, compute the difference it would make
		// to the model if it was collapsed.  The least of these
		// per vertex is cached in each vertex object.
		var count : ushort = myLODVertices.length;
		progressStr = "ComputeAllEdgeCollapseCosts";
		for (var i : ushort = 0; i < count; ++i) {
			var v : LODVertex = myLODVertices[i];
			ComputeEdgeCostAtVertex( v );
			cache[ i ] = v;
			if (i%100 == 0)
			DisplayProgress( i/(count*1.0) );
		}
	};
	
	
	private function UnCollapse ( his : LODHistory ) : void
	{
		// undo collapse for one time.
		
		var i : ushort;
		var n : ushort;
		var list : Array;
		var tmp : Array;
		var t : LODTriangle;
		
		list = his.removedTriangles;
		n = list.length;
		for (i = 0; i < n; ++i)
			myTriangles[ list[i] ].deleted = false;
		
		list = his.replacedVertex;
		n = list.length;
		for (i = 0; i < n; ++i) {
			tmp = list[i];
			t = myTriangles[ tmp[0] ];
			var changedIndex : int = tmp[1];
			
		    if (changedIndex == 0) {
		    	t.v0 = myLODVertices[ tmp[2] ];
		    	t.vn0 = tmp[3];
		    	t.uv0 = tmp[4];
		    }
		    else if (changedIndex == 1) {
		    	t.v1 = myLODVertices[ tmp[2] ];
		    	t.vn1 = tmp[3];
		    	t.uv1 = tmp[4];
		    }
		    else {
		    	t.v2 = myLODVertices[ tmp[2] ];
		    	t.vn2 = tmp[3];
		    	t.uv2 = tmp[4];
		    }
		}
		
	};
	
	
	private function Collapse ( his : LODHistory ) : void
	{
		// collapse for one time.
		
		var i : ushort;
		var n : ushort;
		var list : Array;
		var tmp : Array;
		var t : LODTriangle;
		
		list = his.removedTriangles;
		n = list.length;
		for (i = 0; i < n; ++i)
			myTriangles[ list[i] ].deleted = true;
		
		list = his.replacedVertex;
		n = list.length;
		for (i = 0; i < n; ++i) {
			tmp = list[i];
			t = myTriangles[ tmp[0] ];
			var changedIndex : int = tmp[1];
				
		    if (changedIndex == 0) {
		    	t.v0 = myLODVertices[ tmp[5] ];
		    	t.vn0 = tmp[6];
		    	t.uv0 = tmp[7];
		    }
		    else if (changedIndex == 1) {
		    	t.v1 = myLODVertices[ tmp[5] ];
		    	t.vn1 = tmp[6];
		    	t.uv1 = tmp[7];
		    }
		    else {
		    	t.v2 = myLODVertices[ tmp[5] ];
		    	t.vn2 = tmp[6];
		    	t.uv2 = tmp[7];
		    }
		}
		
	};
	
	
	private function CollapseTest () : void
	{
		var u : LODVertex = cache[searchIndex++];
		var v : LODVertex = u.collapse;
		
		// which LODVertex will be collapsed.
		var his : LODHistory = new LODHistory();
		collapseHistory[ currentcnt-1 ] = his;
		
		// u is a vertex all by itself so just delete it
		if (v && v.deleted) {
			u.deVertex();
			return;
		}
	  else if (!v) {
			u.deVertex();
			return;
	  }
	  
	  
	  var i : int;
	  var j : ushort;
	  var uFace : LODTriangle;
	  var vFace : LODTriangle;
	  var vFaceCount : int;
	  var neighborCount : int = u.neighbor.length;
	  var neighbors : LODVertex[] = new LODVertex[ neighborCount ];
	  var count : ushort = u.face.length;
	  
	  // make tmp a list of all the neighbors of u
	  for (i = 0; i < neighborCount; ++i)
			neighbors[i] = u.neighbor[i];
	  
	  // v を持つフェイスをリストアップ
		// make a list and add face to the list if it has v.
	  var vFaces : Array = new Array();
	  for (i = 0; i < count; ++i) {
	  	uFace = u.face[i];
			if (uFace.HasVertex( v )) {
				vFaces.Push( uFace );
			}
		}
		vFaceCount = vFaces.length;
	  
	  // u と v 両方を持つフェイスを削除
	  // delete triangles on edge uv:
	  for (i = u.face.length - 1; i >= 0; --i) {
			uFace = u.face[i];
			if (uFace.HasVertex(v)) {
				uFace.deTriangle( his ); // 隣接するリファレンスを除外
			}
	  }
	  
	  // u を v へ割当、u は削除
	  // update remaining triangles to have v instead of u
		var u_uv : Vector2;
		var foundUV : Vector2;
		var foundVN : Vector3;
	  for (i = u.face.length - 1; i >= 0; --i) {
	  	uFace = u.face[i];
			if (!uFace.deleted) {
				u_uv = uFace.uvAt( u );
				
				// v の uv, normal を取得
				for (j = 0; j < vFaceCount; ++j) {
					vFace = vFaces[j];
					if (u_uv == vFace.uvAt(u) ) {
						foundUV = vFace.uvAt(v);
						foundVN = vFace.normalAt(v);
						break;
					}
				}
				uFace.ReplaceVertex( u, v, foundUV, foundVN, his );
				
			}
	  }
	  u.deVertex(); // 隣接する頂点からリファレンスを削除
	  
	  // コストの再計算
	  // recompute the edge collapse costs in neighborhood
	  var neighbor : LODVertex;
	  var oldCost : float;
		for (i = 0; i < neighborCount; ++i) {
			neighbor = neighbors[i];
			oldCost = neighbor.cost;
			ComputeEdgeCostAtVertex( neighbor );
			
			if (oldCost > neighbor.cost) SortLeft( neighbor );
			else SortRight( neighbor );
		}
	};
	
	private function SortRight ( v : LODVertex ) : void
	{
		var cacheIndex : ushort = IndexOf( cache, v );
		if (cacheIndex == cacheSize-1) return;
		
		var cost : float = v.cost;
		var c2 : LODVertex = cache[ cacheIndex+1 ];
		if (cost == c2.cost) return;
		
		var maxIndex : int = cacheSize-2;
		while (cost > c2.cost && cacheIndex < maxIndex) {
			cache[ cacheIndex++ ] = c2;
			c2 = cache[ cacheIndex+1 ];
		}
		if (cost > c2.cost)
			cache[ cacheIndex++ ] = c2;
		cache[ cacheIndex ] = v;
	};
	
	private function SortLeft ( v : LODVertex ) : void
	{
		var cacheIndex : ushort = IndexOf( cache, v );
		if (cacheIndex == searchIndex) return;
		
		var cost : float = v.cost;
		var c2 : LODVertex = cache[ cacheIndex-1 ];
		if (cost == c2.cost) return;
		
		while (cost < c2.cost && cacheIndex > searchIndex+2) {
			cache[ cacheIndex-- ] = c2;
			c2 = cache[ cacheIndex-1 ];
		}
		if (cost < c2.cost)
			cache[ cacheIndex-- ] = c2;
		cache[ cacheIndex ] = v;
	};
	
	public function PreCalculate ( tmpMesh : Mesh ) : void
	{
		//_______________________________________________
		//
		// 頂点を共有したメッシュデータへ変換
		//_______________________________________________
		// まず頂点を共有した状態のデータを生成
		// uv, normal は LODTriangle のクラスに持たせる
		// 一時的に頂点だけ共有したメッシュをつくるため。
		// UT mesh data -> optimized mesh data ->
		// calc -> vertex -> avg normal -> uv ->
		// -> reduced mesh data -> UT mesh data
		//
		time_s = Time.realtimeSinceStartup;
		DisplayProgressWait("Initializing...");
		var i : ushort;
		var j : ushort;
		
		myComparer = new LODCompare();
		smoothAngleDot = 1 - (smoothAngle / 90.0);
		
		var tris : int[]  = tmpMesh.triangles;
		targetMesh = tmpMesh;
		
		originalTriangles = tmpMesh.triangles;
		originalVertices	= tmpMesh.vertices;
		originalUVs				= tmpMesh.uv;
		originalNormals		= tmpMesh.normals;
		//originalTangents	= tmpMesh.tangents;
		
		var triNum : ushort = tris.length;
		var vertNum : ushort = originalVertices.length;
		var newVertices : Array = new Array();
		
		var n : ushort;
		var foundAt : int = -1;
		var indice : ushort;
		var v : Vector3;
		
		// 頂点座標が同じ、リスト位置が低いものへ変える
		for (i = 0; i < triNum; ++i) {
			indice = tris[i];
			v = originalVertices[ indice ];
			
			n = newVertices.length;
			foundAt = -1;
			for (j = 0; j < n; ++j)
				if (newVertices[j] == v) {foundAt = j; break;}
			
			if (foundAt != -1)
				tris[i] = foundAt;
			else {
				tris[i] = n;
				newVertices[ n ] = v;
			}
		}
		
		sharedTriangles = tris;
		sharedVertices	= newVertices;
		
		myTriangles = new LODTriangle[ sharedTriangles.length / 3 ];
		myLODVertices = new LODVertex[ sharedVertices.length ];
		
		// 頂点を共有したメッシュデータへ変換 end
		//_______________________________________________
		//
		//
		
		ComputeProgressiveMesh();
		preCalculateDone = true;
		
		//	calculate triangle remove order
		triOrder = new int[myTriangles.length];
		n = collapseHistory.length;
		var cnt : ushort = 0;
		for (i = 0; i < n; ++i) {
			var his : LODHistory = collapseHistory[i];
			var list : Array = his.removedTriangles;
			var m : ushort = list.length;
			for (j = 0; j < m; ++j)
				triOrder[ cnt++ ] = list[j];
		}
	};
	
	
	public function Calculate ( tmpMesh : Mesh ) : void
	{
		
		time_s = Time.realtimeSinceStartup;
		
		DoProgressiveMesh( ratio );
		
		//_______________________________________________
		//
		// メッシュのデータを生成
		//_______________________________________________
		var i : ushort;
		var j : ushort;
		var foundAt : int = -1;
		var v : Vector3;
		var vn : Vector3;
		var dvn : Vector3;
		var vuv : Vector2;
		var his : LODHistory;
		
		var tmp : Array;
		var list : Array;
		
		var cnt : ushort = 0;
		var vertsCount : int = myLODVertices.length;
		var trisCount : int = myTriangles.length;
		
		
		// null をカウントしない
		var reducedTriCount : ushort = 0;
		for (var t : LODTriangle in myTriangles) {
			if (t.deleted) continue;
			++reducedTriCount;
		}
		
		var minTriCount : int = reducedTriCount*3;
		var tris		: int[]			= new int[minTriCount];
		var verts		: Vector3[] = new Vector3[minTriCount];
		var uvs			: Vector2[] = new Vector2[minTriCount];
		var norms		: Vector3[] = new Vector3[minTriCount];
		var indices : ushort[]	= new ushort[minTriCount];
		
		for (i = 0; i < reducedTriCount; ++i) {
			var tri : LODTriangle = myTriangles[ triOrder[i] ];
			//var tri : LODTriangle = myTriangles[i];
			//if (tri.deleted) continue;
			
			var cnt1 : ushort = cnt+1;
			var cnt2 : ushort = cnt+2;
			var v0 : LODVertex = tri.v0;
			var v1 : LODVertex = tri.v1;
			var v2 : LODVertex = tri.v2;
			
	   	verts[ cnt  ] = v0.position;
	   	verts[ cnt1 ] = v1.position;
	   	verts[ cnt2 ] = v2.position;
			tris[ cnt  ] = cnt;
	    tris[ cnt1 ] = cnt1;
	    tris[ cnt2 ] = cnt2;
			uvs[ cnt  ] = tri.uv0;
	    uvs[ cnt1 ] = tri.uv1;
			uvs[ cnt2 ] = tri.uv2;
			norms[ cnt  ] = tri.vn0;
	    norms[ cnt1 ] = tri.vn1;
			norms[ cnt2 ] = tri.vn2;
			
			indices[ cnt  ] = tri.defaultIndex0;
			indices[ cnt1 ] = tri.defaultIndex1;
			indices[ cnt2 ] = tri.defaultIndex2;
			
	   	cnt += 3;
		}
		// メッシュのデータを生成 end
		//_______________________________________________
		
		//_______________________________________________
		//
		// 共有チェック
		//_______________________________________________
		triNum = tris.length;
		var newVertices : Array = new Array();
		var newUVs : Array= new Array();
		var newNormals : Array = new Array();
		var newDVertices : Array = new Array();
		var newDNormals : Array = new Array();
		
		if (bRecalculateNormals) {
			
			for (i = 0; i < triNum; ++i) {
				v = verts[ i ];
				vuv = uvs[ i ];
				vn = norms[ i ];
				n = newVertices.length;
				foundAt = -1;
				for (j = 0; j < n; ++j)
					if (newVertices[j] == v && newUVs[j] == vuv &&
					Vector3.Dot( newNormals[j], vn ) > smoothAngleDot) {foundAt = j; break;}
				
				if (foundAt != -1) tris[i] = foundAt;
				else {
					tris[i] = n;
					newVertices[ n ] = v;
					newUVs[ n ] = vuv;
					newNormals[ n ]  = vn;
					newDNormals[ n ] = dvn;
				}
			}
			
		}
		else {
			for (i = 0; i < triNum; ++i) {
				v = verts[ i ];
				vuv = uvs[ i ];
				vn = norms[ i ];
				dvn = originalNormals[ indices[i] ];
				n = newVertices.length;
				foundAt = -1;
				for (j = 0; j < n; ++j)
					if (newVertices[j] == v && newUVs[j] == vuv && newDNormals[j] == dvn) {foundAt = j; break;}
				
				if (foundAt != -1) tris[i] = foundAt;
				else {
					tris[i] = n;
					newVertices[ n ] = v;
					newUVs[ n ] = vuv;
					newNormals[ n ]  = vn;
					newDNormals[ n ] = dvn;
				}
			}
		}
		//
		// 共有できるかチェック end
		//_______________________________________________
		
		finalVertices = newVertices;
		finalNormals = newNormals;
		finalUVs = newUVs;
		finalTriangles = tris;
	};
	
	
	private function ComputeProgressiveMesh () : void
	{
		var i : ushort;
		var j : ushort;
		var n : ushort;
		var t : LODTriangle;
		
    var vertexCount : int = sharedVertices.length;
    var triangleCount : int = sharedTriangles.length;
    var polyCount : int = triangleCount / 3;
    
    // new myLODVertices
    Clear( myLODVertices, 0, myLODVertices.length );
    progressStr = "Creating LODVertices.";
    for (i = 0; i < vertexCount; ++i) {
			var dv : Vector3 = sharedVertices[i];
			var sel : boolean = false;
			
			n = selectedVertices.length;
			for (j = 0; j < n; ++j) {
				if (selectedVertices[j] == dv) {
					sel = true;
					break;
				}
			}
			myLODVertices[ i ] = new LODVertex( dv, i, sel );
			
			if (i % 100 == 0)
			DisplayProgress( i/(vertexCount*1.0) );
    }
    
    // new myLODTriangles
    Clear( myTriangles, 0, myTriangles.length );
    var cnt : ushort = 0;
    progressStr = "Creating LODTriangles.";
    for (i = 0;i < triangleCount; i+=3) {
			t = new LODTriangle(
													cnt,
													myLODVertices[ sharedTriangles[i] ],
													myLODVertices[ sharedTriangles[i+1] ],
													myLODVertices[ sharedTriangles[i+2] ],
													originalUVs[ originalTriangles[i] ],
													originalUVs[ originalTriangles[i+1] ],
													originalUVs[ originalTriangles[i+2] ] );
			
			t.setDefaultIndices( originalTriangles[i], originalTriangles[i+1], originalTriangles[i+2] );
			if (bRecalculateNormals)
				t.vn0 = t.vn1 = t.vn2 = t.normal;
			else {
				t.vn0 = originalNormals[ originalTriangles[i] ];
				t.vn1 = originalNormals[ originalTriangles[i+1] ];
				t.vn2 = originalNormals[ originalTriangles[i+2] ];
			}
			
			myTriangles[ cnt ] = t;
			++cnt;
			if (cnt % 100 == 0)
			DisplayProgress( cnt/(polyCount*1.0) );
    }
    
    cache = new LODVertex[ vertexCount ];
    cacheSize = vertexCount;
    
    if (bRecalculateNormals)
	    RecalculateNormal(); // set normals for vertex.
    DisplayProgressWait("ComputeAllEdgeCollapseCosts.");
    ComputeAllEdgeCollapseCosts(); // cache all edge collapse costs
    DisplayProgressWait("Sorting an cache array.");
    Sort( cache, myComparer ); // lower cost to the left.
    
    collapseHistory = new LODHistory[ vertexCount ];
    
    // 削減テスト開始
    progressStr = "Collapse Testing.";
    currentcnt = myLODVertices.length + 1;
    searchIndex = 0;
    while(--currentcnt > 0) {
			CollapseTest();
			if (currentcnt % 100 == 0)
			DisplayProgress( 1-(currentcnt/(vertexCount*1.0)) );
    }
    
    
    // LOD Data size calculation
    n = collapseHistory.length;
    var tmpBytes : int = 0;
    var tmpHis : LODHistory;
    for (i = 0; i < n; ++i) {
	    tmpHis = collapseHistory[i];
	    tmpBytes += (
    							tmpHis.removedTriangles.length * 2 + 
    							tmpHis.replacedVertex.length * 14
    							) * 4;
    }
    lodDataSize = tmpBytes;
    
	};
	
	
	private function DoProgressiveMesh( ratio : float ) : void
	{
		var i : int;
		var target : ushort = Mathf.FloorToInt( ratio * sharedVertices.length );
		
		if (lastTarget < target) {
    	for (i = lastTarget; i < target; ++i)
    		UnCollapse( collapseHistory[i] );
		}
		else {
			for (i = lastTarget-1; i >= target; --i)
				Collapse( collapseHistory[i] );
		}
    lastTarget = target;
    
	};
	
	
	private function RecalculateNormal () : void
	{
		var n : ushort = myTriangles.length;
		for (var i : ushort = 0; i < n; ++i) {
			var f : LODTriangle = myTriangles[i];
			if (f.deleted) continue;
			f.RecalculateAvgNormals( smoothAngleDot );
		}
	};
	
	private var progressTitle		: String = "LOD System";
	private var progressStr		: String = "";
	private function DisplayProgress ( p : float ) : void
	{
		EditorUtility.DisplayProgressBar(progressTitle, progressStr + " " + (p*100).ToString("f0") + "%", p);
	};
	private function DisplayProgressWait ( str : String ) : void
	{
		progressStr = str;
		EditorUtility.DisplayProgressBar(progressTitle, progressStr, 0.999);
	};
}