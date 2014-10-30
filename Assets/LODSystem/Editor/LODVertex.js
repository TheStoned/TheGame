#pragma strict
#pragma implicit
#pragma downcast
//
//	Level of Detail (LOD) for Unity3D 2.6.1.
//	by Junichi Fukuhara 2010
//	http://www.macroseed.com
//
class LODVertex
{
	public var position : Vector3;
	public var face : Array;
	public var neighbor : Array;
	
	public var id : ushort;
	public var cost : float;
	public var collapse : LODVertex;
	public var selected : boolean;
	public var deleted : boolean = false;
	
	
	public function LODVertex ( vec : Vector3, _id : ushort, _selected : boolean )
	{
    position = vec;
    id = _id;
    selected = _selected;
    
    neighbor = new Array();
    face = new Array();
    cost = 0.0;
    collapse = null;
	};
	
	
	public function deVertex () : void
	{
		var nb : LODVertex;
    while( neighbor.length ) {
			nb = neighbor[0];
			nb.neighbor.Remove( this );
			neighbor.Remove( nb );
    }
    deleted = true;
	};
	
	
	public function IsBorder () : boolean
	{
		var j : ushort;
    var n : ushort = neighbor.length;
    var nb : LODVertex;
    var face_len : ushort;
    var f : LODTriangle;
    var count : ushort = 0;
    
    for (var i : ushort = 0; i < n; ++i) {
			count = 0;
			nb = neighbor[i];
			face_len = face.length;
			for (j = 0; j < face_len; ++j) {
				f = face[j];
				if (f.HasVertex( nb ))
					++count;
			}
			if (count == 1) return true;
		}
		return false;
	};
	
	
	public function AddFace ( f : LODTriangle ) : void
	{
		face.Push( f );
	};
	
	public function RemoveFace ( f : LODTriangle ) : void
	{
		face.Remove( f );
	};
	
	
	public function AddNeighbor ( v : LODVertex ) : void
	{
		var i : ushort;
		var foundAt : int = -1;
		var n : ushort = neighbor.length;
		
		for (i = 0; i < n; ++i)
			if (neighbor[i] == v) {foundAt = i; break;}
		
		if (foundAt == -1)
			neighbor.Push( v );
	};
	
	
	public function RemoveIfNonNeighbor ( v : LODVertex ) : void
	{
		// removes v from neighbor list if v isn't a neighbor.
		// if (System.Array.IndexOf( neighbors, v ) == -1)
		
		var i : ushort;
		var foundAt : int = -1;
		var n : ushort = neighbor.length;
		var f : LODTriangle;
		
		for (i = 0; i < n; ++i)
			if (neighbor[i] == v) {foundAt = i; break;}
		
		if (foundAt == -1) return;
		
		n = face.length;
		for (i = 0; i < n; ++i) {
			f = face[i];
			if (f.HasVertex( v )) return;
		}
		
		neighbor.Remove( v );
	};
	
};
