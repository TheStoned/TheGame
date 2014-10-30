#pragma strict
#pragma implicit
#pragma downcast
//
//	Level of Detail (LOD) for Unity3D 2.6.1.
//	by Junichi Fukuhara 2010
//	http://www.macroseed.com
//	
//	Class for saving variables for preview.
//	Used at Editor mode only.
//
class LODSystemPreview extends MonoBehaviour
{
	
	public var sMesh				: Mesh; // Original sharedMesh
	public var isCalculated : boolean = false;
	public var isPreview		: boolean = false;
	public var tmpMesh 			: Mesh;
	public var tmpMeshName	: String = "";
	public var ratio				: float = 0.5;
	public var smoothAngle	: float = 45.0;
	
	public var selectedPos	: Array = new Array();
}