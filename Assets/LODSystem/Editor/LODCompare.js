#pragma strict
#pragma implicit
#pragma downcast
//
//	Level of Detail (LOD) for Unity3D 2.6.1.
//	by Junichi Fukuhara 2010
//	http://www.macroseed.com
//
class LODCompare implements System.Collections.IComparer
{
	private var vx : LODVertex;
	private var vy : LODVertex;
	
	public function Compare ( x : Object, y : Object ) : int
	{
		vx = x;
		vy = y;
		if (vx == vy) return 0;
		else if (vx.cost < vy.cost) return -1;
		return 1;
	}
}
