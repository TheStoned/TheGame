#pragma strict
#pragma implicit
#pragma downcast
//
//	Level of Detail (LOD) for Unity3D 2.6.1.
//	by Junichi Fukuhara 2010
//	http://www.macroseed.com
//
class LODHistory
{
	
	public var id : ushort;
	public var removedTriangles : Array;
	public var replacedVertex : Array;
	
	public function LODHistory ()
	{
		removedTriangles = new Array();
		replacedVertex = new Array();
	};
	
	// Triangle
	public function RemovedTriangle ( f : ushort ) : void
	{
		removedTriangles.Push( f );
	};
	
	public function ReplaceVertex (
																	f : ushort, u : ushort, v : ushort, normal : Vector3, uv : Vector2,
																	newv : ushort, newnormal : Vector3, newuv : Vector2
																	) : void
	{
		var list : Array = new Array();
		list[0] = f;
		list[1] = u;
		list[2] = v;
		list[3] = normal;
		list[4] = uv;
		list[5] = newv;
		list[6] = newnormal;
		list[7] = newuv;
		replacedVertex.Push( list );
	};
	
};
