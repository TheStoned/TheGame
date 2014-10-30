#pragma strict
#pragma implicit
#pragma downcast
//
//	Level of Detail (LOD) for Unity3D 2.6.1.
//	by Junichi Fukuhara 2010
//	http://www.macroseed.com
//
class LODTriangle
{
	public var id : ushort;
	
	public var v0 : LODVertex;
	public var v1 : LODVertex;
	public var v2 : LODVertex;
	
	public var defaultIndex0 : ushort;
	public var defaultIndex1 : ushort;
	public var defaultIndex2 : ushort;
	
	public var uv0 : Vector2;
	public var uv1 : Vector2;
	public var uv2 : Vector2;
	
	public var vn0 : Vector3;
	public var vn1 : Vector3;
	public var vn2 : Vector3;
	
	public var normal : Vector3;
	
	public var deleted : boolean = false;
	
	
	public function LODTriangle (
																_id : int,
																_v0 : LODVertex,
																_v1 : LODVertex,
																_v2 : LODVertex,
																_uv0 : Vector2,
																_uv1 : Vector2,
																_uv2 : Vector2 )
	{
		id = _id;
    v0 = _v0;
    v1 = _v1;
    v2 = _v2;
    
    uv0 = _uv0;
		uv1 = _uv1;
		uv2 = _uv2;
		
    RecalculateNormal();
    
    v0.AddFace( this );
    v1.AddFace( this );
    v2.AddFace( this );
    
    v0.AddNeighbor( v1 );
    v0.AddNeighbor( v2 );
    v1.AddNeighbor( v0 );
    v1.AddNeighbor( v2 );
    v2.AddNeighbor( v0 );
    v2.AddNeighbor( v1 );
 	};
	
	
	public function setDefaultIndices ( n0 : int, n1 : int, n2 : int ) : void
	{
		defaultIndex0 = n0;
		defaultIndex1 = n1;
		defaultIndex2 = n2;
	};
	
	
	public function deTriangle ( his : LODHistory ) : void
	{
    v0.RemoveFace( this );
    v1.RemoveFace( this );
    v2.RemoveFace( this );
    
    // remove from neighbor
    v0.RemoveIfNonNeighbor( v1 );
    v0.RemoveIfNonNeighbor( v2 );
    v1.RemoveIfNonNeighbor( v0 );
    v1.RemoveIfNonNeighbor( v2 );
    v2.RemoveIfNonNeighbor( v1 );
    v2.RemoveIfNonNeighbor( v0 );
    
    deleted = true;
    his.RemovedTriangle( id );
	};
	
	
	public function uvAt ( v : LODVertex ) : Vector2
	{
		var vec : Vector3 = v.position;
		if (vec == v0.position) return uv0;
		else if (vec == v1.position) return uv1;
		else if (vec == v2.position) return uv2;
		return Vector2();
	};
	public function normalAt ( v : LODVertex ) : Vector3
	{
		var vec : Vector3 = v.position;
		if (vec == v0.position) return vn0;
		else if (vec == v1.position) return vn1;
		else if (vec == v2.position) return vn2;
		return Vector3();
	};
	public function setUV ( v : LODVertex, newuv : Vector2 ) : void
	{
		var vec : Vector3 = v.position;
		if (vec == v0.position) uv0 = newuv;
		else if (vec == v1.position) uv1 = newuv;
		else if (vec == v2.position) uv2 = newuv;
	};
	
	
	public function setVN ( v : LODVertex, newNormal : Vector3 ) : void
	{
		var vec : Vector3 = v.position;
		if (vec == v0.position) vn0 = newNormal;
		else if (vec == v1.position) vn1 = newNormal;
		else if (vec == v2.position) vn2 = newNormal;
	};
	
	
	public function HasVertex ( v : LODVertex ) : boolean
	{
		var vec : Vector3 = v.position;
		return (vec == v0.position || vec == v1.position || vec == v2.position);
	};
	
	
	public function RecalculateNormal () : void
	{
		var v1pos : Vector3 = v1.position;
		normal = Vector3.Cross(v1pos - v0.position, v2.position - v1pos);
		if (normal.magnitude == 0) return;
		normal.Normalize();
	};
	
	
	// Only called if 'Recalculate Normals' is enabled.
	// This will smooth out normals event at uv seams.
	public function RecalculateAvgNormals ( smoothAngleDot : float ) : void
	{

		var i : int;
		var flist : Array = new Array();
		var slist : Array = new Array();
		var n : int = flist.length;
		var f : LODTriangle;
		var fn : Vector3;
		
		flist = v0.face;
		slist.Clear();
		for (i = 0; i < n; ++i) {
			f = flist[i];
			fn = f.normal;
			//if (Vector3.Dot( f.normal, normal ) > smoothAngleDot) {
			if (fn.x*normal.x + fn.y*normal.y + fn.z*normal.z > smoothAngleDot) {
				vn0 += fn;
				slist.Push( f );
			}
		}
		vn0.Normalize();
		n = slist.length;
		for (i = 0; i < n; ++i) { f = slist[i]; f.setVN( v0, vn0 ); }
		
		flist = v1.face;
		n = flist.length;
		slist.Clear();
		for (i = 0; i < n; ++i) {
			f = flist[i];
			fn = f.normal;
			//if (Vector3.Dot( f.normal, normal ) > smoothAngleDot) {
			if (fn.x*normal.x + fn.y*normal.y + fn.z*normal.z > smoothAngleDot) {
				vn1 += fn;
				slist.Push( f );
			}
		}
		vn1.Normalize();
		n = slist.length;
		for (i = 0; i < n; ++i) { f = slist[i]; f.setVN( v1, vn1 ); }
		
		flist = v2.face;
		n = flist.length;
		slist.Clear();
		for (i = 0; i < n; ++i) {
			f = flist[i];
			fn = f.normal;
			//if (Vector3.Dot( f.normal, normal ) > smoothAngleDot) {
			if (fn.x*normal.x + fn.y*normal.y + fn.z*normal.z > smoothAngleDot) {
				vn2 += fn;
				slist.Push( f );
			}
		}
		vn2.Normalize();
		n = slist.length;
		for (i = 0; i < n; ++i) { f = slist[i]; f.setVN( v2, vn2 ); }
		
	};
	
	// Only called if 'Recalculate Tangents' is enabled.
	// Most of the time don't need this for low detailed mesh.
	/*
	public function ComputeTangentBasis (
										p1 : Vector3, p2 : Vector3, p3 : Vector3, 
										uv1 : Vector2, uv2 : Vector2, uv3 : Vector2 ) : void
	{
		var edge1 : Vector3 = p2 - p1;
		var edge2 : Vector3 = p3 - p1;
		var edge1uv : Vector2 = uv2 - uv1;
		var edge2uv : Vector2 = uv3 - uv1;

		var cp : float = edge1uv.y * edge2uv.x - edge1uv.x * edge2uv.y;

		if ( cp != 0.0 ) {
			var mul				: float = 1.0 / cp;
			var tangent		: Vector3 = (edge1 * -edge2uv.y + edge2 * edge1uv.y) * mul;
			var bitangent	: Vector3 = (edge1 * -edge2uv.x + edge2 * edge1uv.x) * mul;
	
			tangent.Normalize();
			bitangent.Normalize();
		}
	};
	*/
	
	
	public function ReplaceVertex (
																	vo : LODVertex,
																	vnew : LODVertex,
																	newUV : Vector2,
																	newVN : Vector3,
																	his : LODHistory ) : void
	{
		var vec : Vector3 = vo.position;
		var changedVertex : LODVertex = v2;
		var changedVertexId : int = 2;
		var changedNormal : Vector3 = vn2;
		var changedUV : Vector2 = uv2;
		
    if (vec == v0.position) {
    	changedVertex = v0;
    	changedVertexId = 0;
    	changedNormal = vn0;
    	changedUV = uv0;
    	v0 = vnew;
    	vn0 = newVN;
    	uv0 = newUV;
    }
    else if (vec == v1.position) {
    	changedVertex = v1;
    	changedVertexId = 1;
    	changedNormal = vn1;
    	changedUV = uv1;
    	v1 = vnew;
    	vn1 = newVN;
    	uv1 = newUV;
    }
    else {
    	v2 = vnew;
    	vn2 = newVN;
    	uv2 = newUV;
    }
    
    vo.RemoveFace( this );
    vnew.AddFace( this );
    
    vo.RemoveIfNonNeighbor( v0 );
    v0.RemoveIfNonNeighbor( vo );
    vo.RemoveIfNonNeighbor( v1 );
    v1.RemoveIfNonNeighbor( vo );
		vo.RemoveIfNonNeighbor( v2 );
    v2.RemoveIfNonNeighbor( vo );
    
		v0.AddNeighbor( v1 );
    v0.AddNeighbor( v2 );
    v1.AddNeighbor( v0 );
    v1.AddNeighbor( v2 );
    v2.AddNeighbor( v0 );
    v2.AddNeighbor( v1 );
    
    RecalculateNormal();
    	
    his.ReplaceVertex( id, changedVertexId, changedVertex.id, changedNormal, changedUV, vnew.id, newVN, newUV );
    //his.ReplaceVertex2( id, changedVertexId, changedVertex.position, changedNormal, changedUV, vnew.position, newVN, newUV );
    //his.ReplaceVertex2( id*3 + changedVertexId, vnew.id );
	};
	
	
};