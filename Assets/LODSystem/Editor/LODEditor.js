#pragma strict
#pragma implicit
#pragma downcast
//
//	Level of Detail (LOD) for Unity3D 2.6.1.
//	by Junichi Fukuhara 2010
//	http://www.macroseed.com
//
@CustomEditor( typeof(LODSystemPreview) )
class LODEditor extends Editor
{
	
	private var script : LODSystemPreview;
	private var lodSystem : LODSystemEditor;
	
	private var msf : MeshFilter;
	private var col : MeshCollider;
	
	private var targetPoint : Vector3 = Vector3.zero;
	private var isStart : boolean = false;
	
	
	private var goCurTarget : GameObject;
	private var originalMesh : Mesh;
	private var previewMeshName : String;
	
	private var verts : Vector3[];
	private var checkVNList : Array[];
	
	
	// for inspector gui.
	private var cssButton	: GUIStyle;
	private var toolMode : byte = 0;
	private var showDetails	: boolean = false;
	
	// for scene gui.
	private var dotCapSize : float = 0.02;
	private var dotCapColorNormal : Color = Color(0.5,0.5,0.5, 0.5 );
	private var dotCapColorHover : Color = Color(1,1,1, 0.5);
	private var dotCapColorActive : Color = Color(1,0,0);
	private var dotCapColorMultipleSlection : Color = Color(0,1,1);
	private var selectionRectBGColor : Color = Color(1,1,1);
	private var cssSelectionBox : GUIStyle;
	private var cssInfoBox : GUIStyle;
	private var cam : Camera;
	private var mouseDownPos : Vector2;
	private var selectionRect : Rect = new Rect();
	private var stillDown : boolean = false;
	private var infoStr : String;
	private var lastDistance : int = 0;
	private var lastRatio : float;
	
	private var curMouseOverWindow : EditorWindow;
	
	
	@MenuItem ("LOD System/Simplify Mesh")
	static function initialize () : void
	{
		if (Selection.activeTransform == null) {
			EditorUtility.DisplayDialog ("", "Select a GameObject first.", "OK");
			return;
		}
		var go : GameObject = Selection.activeGameObject;
		
		if (!go.GetComponent(LODSystemPreview)) {
			var lodSys : LODSystemPreview = go.AddComponent(LODSystemPreview);
		}
	};
	
	
	public function OnEnable () : void
	{
		if (EditorApplication.isPlaying || EditorApplication.isPlayingOrWillChangePlaymode) return;
		//EditorApplication.update = this.customUpdate;
		
		var i : int;
		var n : int;
		
		script = target;
		cam = Camera.current;
		goCurTarget = script.gameObject;
		
		// First time if script.sMesh is not set.
		// We have to keep the original sharedMesh reference.
		checkSharedMeshIsSet();
		
		if (!lodSystem) {
			lodSystem = new LODSystemEditor();
			script.isCalculated = false;
			PreviewEnd();
		}
		verts = script.sMesh.vertices;
		var normals : Vector3[] = script.sMesh.normals;
		
		// make a check list of normals
		n = normals.length;
		checkVNList = new Array[n];
		for (i = 0; i < n; ++i)
			checkVNList[i] = new Array(normals[i]);
		
		// don't add same vertex's position to the list.
		var newVerts : Array = new Array();
		var foundAt : int;
		n = verts.length;
		for (i = 0; i < n; ++i) {
			var v : Vector3 = verts[ i ];
			var vn : Vector3 = normals[ i ];
			
			foundAt = System.Array.IndexOf( verts, v );
			if (foundAt != -1) {
				newVerts[ foundAt ] = v;
				
				var normalList : Array = checkVNList[ foundAt ];
				normalList.Remove( vn );
				normalList.Push( vn );
			}
			else {
				newVerts.Push( v );
				checkVNList[i].Remove( vn );
				checkVNList[i].Push( vn );
			}
		}
		verts = newVerts.ToBuiltin( Vector3 );
		
		// css I just needed to be an artist for a moment.
		var path : String = "Assets/LODSystem/Editor/Resources/";
		var tmpRectOffset = new RectOffset();
		
		cssButton = new GUIStyle();
		cssButton.normal.background = Resources.LoadAssetAtPath( path + "blackButton.png", Texture2D);
		cssButton.normal.textColor = Color(1,1,1);
		cssButton.active.background = Resources.LoadAssetAtPath( path + "blackButtonDown.png", Texture2D);
		cssButton.active.textColor = Color(0.5,0.5,0.5);
		cssButton.border.left =
		cssButton.border.right =
		cssButton.border.top =
		cssButton.border.bottom = 3;
		cssButton.alignment = TextAnchor.MiddleCenter;
		cssButton.fixedHeight = 24;
		
		cssSelectionBox = new GUIStyle();
		cssSelectionBox.normal.background = Resources.LoadAssetAtPath( path + "boxNormal.png", Texture2D);
		cssSelectionBox.normal.textColor = Color(1,1,1);
		cssSelectionBox.margin =
		cssSelectionBox.padding = tmpRectOffset;
		cssSelectionBox.border.left =
		cssSelectionBox.border.right =
		cssSelectionBox.border.top =
		cssSelectionBox.border.bottom = 3;
		
		cssInfoBox = new GUIStyle();
		cssInfoBox.normal.textColor = Color(1,1,1);
		cssInfoBox.margin =
		cssInfoBox.border = tmpRectOffset;
		cssInfoBox.padding.left =
		cssInfoBox.padding.right =
		cssInfoBox.padding.top =
		cssInfoBox.padding.bottom = 10;
		cssInfoBox.alignment = TextAnchor.UpperLeft;
	};
	
	
	public function OnDisable () : void
	{
		if (EditorApplication.isPlaying || EditorApplication.isPlayingOrWillChangePlaymode) return;
		
		EditorUtility.ClearProgressBar();
		
		var tmpObjs : Object;
		var mf : MeshFilter = goCurTarget.GetComponent( MeshFilter );
		
		// object has been deleted.
		if (script == null) {
			if (mf.sharedMesh.name == previewMeshName) {
				mf.sharedMesh = originalMesh;
			}
			ClearMeshes();
		}
		
		script.isPreview = false;
		mf.sharedMesh = script.sMesh;
		tmpObjs = FindObjectsOfType( Mesh );
    for (var tmp : Mesh in tmpObjs) {
			if (tmp.name == script.tmpMeshName)
				DestroyImmediate( tmp );
    }
    
		EditorApplication.update = null;
		EditorApplication.modifierKeysChanged = null;
		EditorApplication.playmodeStateChanged = null;
		
		previewMeshName = null;
		originalMesh = null;
		goCurTarget = null;
		lodSystem = null;
		script = null;
	};
	
	
	public function OnInspectorGUI () : void
	{
		if (EditorApplication.isPlaying || EditorApplication.isPlayingOrWillChangePlaymode) return;
		
		var e : Event = Event.current;
		var eType : EventType = e.type;
		var r : Rect;
		
		EditorGUIUtility.LookLikeControls();
		
		EditorGUILayout.Separator();
		EditorGUILayout.BeginVertical();
		
		
		EditorGUILayout.Separator();
		EditorGUILayout.BeginHorizontal();
		GUILayout.Space(20);
		var descriptionStr : String = "";
		descriptionStr += "Select vertex that you don't want it to be collapsed.\n";
		descriptionStr += "Hold left [SHIFT] key to unselect.";
		GUILayout.Label( descriptionStr );
		EditorGUILayout.EndHorizontal();
		
		EditorGUILayout.Separator();
		EditorGUILayout.BeginHorizontal();
		EditorGUILayout.Separator();
		var toolbarOptions : GUIContent[] = new GUIContent[2];
		toolbarOptions[0] = new GUIContent("Simple");
		toolbarOptions[1] = new GUIContent("Advanced");
		GUI.enabled = false;
		toolMode = GUILayout.Toolbar( toolMode, toolbarOptions, GUILayout.MaxWidth(300));
		GUI.enabled = true;
		EditorGUILayout.Separator();
		EditorGUILayout.EndHorizontal();
		
		EditorGUILayout.Separator();
		EditorGUILayout.BeginHorizontal();
		EditorGUILayout.Separator();
		var fTmpRatio : float = Mathf.Round((script.ratio * 100)) * 0.01;
		GUI.enabled = script.isCalculated;
		script.ratio = EditorGUILayout.Slider("Collapse Ratio", fTmpRatio, 0.0, 1.0);
		GUI.enabled = true;
		if (script.ratio+"" != (Mathf.Round((script.ratio * 100)) * 0.01)+"") {
			if (lodSystem.preCalculateDone) {
				
				lodSystem.ratio = script.ratio;
				lodSystem.Calculate( script.tmpMesh );
				
				if (script.isPreview)
					UpdateMesh();
			}
		}
		EditorGUILayout.Separator();
		EditorGUILayout.EndHorizontal();
		
		
		
		EditorGUILayout.Separator();
		EditorGUILayout.BeginHorizontal();
		EditorGUILayout.Separator();
		GUILayout.Label("Recalculate Normals");
		lodSystem.bRecalculateNormals = EditorGUILayout.Toggle(lodSystem.bRecalculateNormals);
		EditorGUILayout.Separator();
		EditorGUILayout.EndHorizontal();
		
		//EditorGUILayout.Separator();
		EditorGUILayout.BeginHorizontal();
		EditorGUILayout.Separator();
		var smoothAngle : float = Mathf.Floor(script.smoothAngle);
		GUI.enabled = lodSystem.bRecalculateNormals;
		script.smoothAngle = EditorGUILayout.Slider("Smooth Angle", smoothAngle, 0, 180);
		GUI.enabled = true;
		EditorGUILayout.Separator();
		EditorGUILayout.EndHorizontal();
		
		
		EditorGUILayout.Separator();
		
		
		// buttons
		EditorGUILayout.Separator();
		
		EditorGUILayout.BeginHorizontal();
		EditorGUILayout.Separator();
		if (GUILayout.Button("Clear All Selection", cssButton, GUILayout.Height(20), GUILayout.MaxWidth(200)))
		{
			lodSystem.preCalculateDone = (script.selectedPos.length == 0);
			script.selectedPos.Clear();
			Repaint();
			EditorUtility.SetDirty( script );
		}
		EditorGUILayout.Separator();
		EditorGUILayout.EndHorizontal();
		
		EditorGUILayout.Separator();
		
		EditorGUILayout.BeginHorizontal();
		EditorGUILayout.Separator();
		GUI.enabled = !lodSystem.preCalculateDone;
		if (GUILayout.Button("Calculate", cssButton, GUILayout.Height(20), GUILayout.MaxWidth(200))) 
		{
			checkSharedMeshIsSet();
			var timeStart : float = Time.realtimeSinceStartup;
			lodSystem.selectedVertices = script.selectedPos;
			lodSystem.ratio = script.ratio;
			lodSystem.smoothAngle = script.smoothAngle;
			if (!lodSystem.preCalculateDone)
				lodSystem.PreCalculate( script.sMesh );
			EditorUtility.ClearProgressBar();
			
			ClearMeshes();
			
			lodSystem.ratio = 0.5;
			script.ratio = 0.5;
			lodSystem.Calculate( script.sMesh );
			script.isCalculated = true;
			
			if (script.isPreview) {
				PreviewEnd();
				Preview();
			}
				
			var notifyStr : String = "Process Time";
			notifyStr += " : " + (Time.realtimeSinceStartup - timeStart).ToString("f2") + " sec.";
			EditorWindow.focusedWindow.ShowNotification( new GUIContent(notifyStr) );
			
			GUIUtility.ExitGUI();
			
			EditorUtility.SetDirty( script );
		}
		GUI.enabled = true;
		EditorGUILayout.Separator();
		EditorGUILayout.EndHorizontal();
		
		
		if (!script.gameObject.active) {
			descriptionStr = "Game Object is not active.  ";
			descriptionStr += "Disabling Preview Button.";
			
			EditorGUILayout.Separator();
			EditorGUILayout.BeginHorizontal();
			GUILayout.Space(20);
			GUILayout.Label( descriptionStr );
			EditorGUILayout.EndHorizontal();
		}
		
		
		EditorGUILayout.Separator();
		
		EditorGUILayout.BeginHorizontal();
		EditorGUILayout.Separator();
		GUI.enabled = (goCurTarget.active && script.isCalculated);
		var str : String = "Preview";
		if (script.isPreview) str = "End Preview";
		if (GUILayout.Button(str, cssButton, GUILayout.Height(20), GUILayout.Width(200))) 
		{
			if (script.isPreview) {
				var tmpObjs : Object = FindObjectsOfType( Mesh );
		    for (var tmp : Mesh in tmpObjs) {
		        if (tmp.name == script.tmpMeshName)
		        	DestroyImmediate( tmp );
		    }
		    PreviewEnd();
			}
			else Preview();
			
			EditorUtility.SetDirty( script );
		}
		GUI.enabled = true;
		EditorGUILayout.Separator();
		EditorGUILayout.EndHorizontal();
		
		
		EditorGUILayout.Separator();
		
		EditorGUILayout.BeginHorizontal();
		EditorGUILayout.Separator();
		if (GUILayout.Button("Save As New Asset", cssButton, GUILayout.Height(20), GUILayout.MaxWidth(200)))
		{
			var mf : MeshFilter = script.GetComponent( MeshFilter );
			
			savePath = AssetDatabase.GenerateUniqueAssetPath("Assets/LODSystem/Output/" + mf.sharedMesh.name);
			AssetDatabase.CreateAsset( mf.sharedMesh, savePath+".asset");
			EditorUtility.FocusProjectWindow();
			EditorUtility.DisplayDialog ("", "'" + savePath + "' created.", "OK");
			Debug.Log( savePath + " created." );
			
			DestroyImmediate( script );
			GUIUtility.ExitGUI();
		}
		EditorGUILayout.Separator();
		EditorGUILayout.EndHorizontal();
		// buttons end
		
		
		EditorGUILayout.Separator();
		EditorGUILayout.EndVertical();
		
		if (GUI.changed)
			EditorUtility.SetDirty( target );
	};
	
	
	public function OnSceneGUI () : void
	{
		if (EditorApplication.isPlaying || EditorApplication.isPlayingOrWillChangePlaymode) return;
		
		if (!script.gameObject.active) return;
		
		var e : Event = Event.current;
		var eType : EventType = e.type;
		if (!cam) cam = Camera.current;
		var camPos : Vector3 = cam.transform.position;
		var camFwd	: Vector3 = cam.transform.forward;
		
		// Add default control to 0 if there is nothing.
		HandleUtility.AddDefaultControl( 0 );
		
		var i : int;
		var tmpRect : Rect;
		var innerViewWidth : int = cam.pixelWidth;
		var innerViewHeight : int = cam.pixelHeight;
		var mouseOffset : float = 19;
		var guiOffset : float = 0; // extra 2 pixels some where. maybe top and bottom borders?
		var hotId : int = GUIUtility.hotControl;
		//var nearId : int = HandleUtility.nearestControl;
		var mouseX	: float = e.mousePosition.x;
		var mouseY	: float = e.mousePosition.y;
		var mousePos : Vector2 = new Vector2( mouseX, innerViewHeight - (mouseY - mouseOffset) );
		var screenPos : Array = new Array();
		var spos : Vector2;
		var modelPos : Vector3 = script.transform.position;
		var dis : float = (modelPos - camPos).magnitude;
		var curMesh : Mesh = script.tmpMesh;
		var msf : MeshFilter = goCurTarget.GetComponent( MeshFilter );
		
		// events
		var eMouseDown	: boolean = (eType == EventType.MouseDown);
		var eMouseUp		: boolean = (eType == EventType.MouseUp);
		var eIgnore			: boolean = (eType == EventType.Ignore);
		var eShift			: boolean = e.shift;
		var eOption			: boolean = e.alt;
		
		// Information gui.
		// update infoStr only if vertices have changed.
		if (lastRatio != script.ratio) {
			infoStr = "Reduced : " + (script.ratio * 100).ToString("f1") + "%\n";
			infoStr += "Before : " + (script.sMesh.triangles.length/3) + " tris ";
			infoStr += script.sMesh.vertices.length + " verts ";
			infoStr += EditorUtility.FormatBytes(
									script.sMesh.vertices.length * 12 +
									script.sMesh.normals.length * 12 +
									script.sMesh.uv.length * 8 +
									script.sMesh.triangles.length * 4) + "\n";
			if (curMesh) {
			infoStr += "After : " + (curMesh.triangles.length/3) + " tris ";
			infoStr += curMesh.vertices.length + " verts ";
			infoStr += EditorUtility.FormatBytes(
									curMesh.vertices.length * 12 +
									curMesh.normals.length * 12 +
									curMesh.uv.length * 8 +
									curMesh.triangles.length * 4) + "\n";
			}
			infoStr += "Distance : " + (dis).ToString("f2") + "\n";
			infoStr += "Selected vertices : " + script.selectedPos.length + " verts \n";
			infoStr += "LOD data size : " + EditorUtility.FormatBytes( lodSystem.lodDataSize );
		}
		
		//Handles.BeginGUI( Rect (0, guiOffset, innerViewWidth, innerViewHeight) );
		Handles.BeginGUI();
		GUILayout.Box( infoStr, cssInfoBox );
		
		if (script.isPreview) {
			Handles.EndGUI();
			lastDistance = dis;
			lastRatio = script.ratio;
			return;
		}
		
		//GUILayout.Box( infoStr );
		EditorGUILayout.Separator();
		if (GUILayout.Button( "Reset", GUILayout.Height(24), GUILayout.Width(100) ))
		{
			script.selectedPos.Clear();
			e.Use();
		}
		Handles.EndGUI();
		
		
		if (eOption) return;
		if (eMouseDown) {
			selectionRect = Rect( mouseX, mouseY, 1, 1 );
			mouseDownPos = Vector2( mouseX, mouseY );
			stillDown = true;
			e.Use();
		}
		else if (eMouseUp) {
			stillDown = false;
			e.Use();
		}
		else if (eIgnore) {
			stillDown = false;
			e.Use();
		}

		// Draw selection rect.
		if (stillDown) {
			
			// Flip rect if it has opposite coordinates.
			if (mouseX <= mouseDownPos.x) {
				selectionRect.xMax = mouseDownPos.x;
				selectionRect.xMin = mouseX;
			} else {
				selectionRect.xMin = mouseDownPos.x;
				selectionRect.xMax = mouseX;
			}
			if (mouseY <= mouseDownPos.y) {
				selectionRect.yMax = mouseDownPos.y;
				selectionRect.yMin = mouseY;
			} else {
				selectionRect.yMin = mouseDownPos.y;
				selectionRect.yMax = mouseY;
			}
			
			selectionRect.y -= guiOffset;
			//Handles.BeginGUI( Rect (0, guiOffset, innerViewWidth, innerViewHeight) );
			Handles.BeginGUI();
			GUI.backgroundColor = selectionRectBGColor;
			GUI.Box( selectionRect, "", cssSelectionBox );
			GUI.backgroundColor = Color(1,1,1);
			Handles.EndGUI();
			
		}
		
		
		// show vertices as handles.
		var n : int = verts.length;
		var found : int = -1;
		var pos : Vector3;
		var wpos : Vector3;
		var vnList : Array;
		var camN : Vector3;
		var vnCount : int;
		var isVisible : boolean;
		
		for (i = 0; i < n; i++) {
			pos = verts[i];
			wpos = pos + modelPos;
			vnList = checkVNList[i];
			camN = (camPos - wpos).normalized;
			
			
			// see if the vertex is culled.
			vnCount = vnList.length;
			isVisible = false;
			for (var k : int = 0; k < vnCount; ++k) {
				vn = vnList[k];
				if (Vector3.Dot( camN, vnList[k]) > 0) {
					isVisible = true;
					break;
				}
			}
			if (!isVisible) continue;
			
			
			// multiple selections here.
			spos = cam.WorldToScreenPoint( wpos ) - Vector2( 0, 2 );
			var spos2 : Vector2 = HandleUtility.WorldToGUIPoint( wpos ) - Vector2( 0, guiOffset );
			if (selectionRect.Contains( spos2 )) {
				
				if (stillDown) {
					Handles.color = dotCapColorMultipleSlection;
					Handles.DotCap( i, wpos, Quaternion.identity, dotCapSize );
				}
				else if (eMouseUp || eIgnore) {
					script.selectedPos.Remove( pos );
					if (!eShift) script.selectedPos.Push( pos );
				}
			}
			
			// rollover here.
			if ((mousePos - spos).sqrMagnitude < 40 && found == -1) {
				Handles.color = dotCapColorHover;
				found = i;
				Handles.DotCap( i, wpos, Quaternion.identity, dotCapSize + 0.01 );
			}
			
			// draw everything else.
			Handles.color = dotCapColorNormal;
			//Handles.DotCap( i, wpos, Quaternion.identity, dotCapSize );
		}
		if (eType == EventType.MouseDrag) e.Use();
		
		
		// current selected vertices.
		Handles.color = dotCapColorActive;
		n = script.selectedPos.length;
		for (i = 0; i < n; ++i) {
			var selpos : Vector3 = script.selectedPos[i];
			Handles.DotCap( i, selpos + modelPos, Quaternion.identity, dotCapSize );
		}
		
		// mouse click selection.
		if (e.clickCount > 0) {
			if (found != -1) {
				script.selectedPos.Remove( verts[found] );
				if (!eShift)
					script.selectedPos.Push( verts[found] );
			}
			lodSystem.preCalculateDone = false;
			e.Use();
		}
		
		// eat it if mouse over needs to be repainted.
		if (found != -1)
			e.Use();
		
		if (GUI.changed)
			EditorUtility.SetDirty( target );
	};
	
	// For Preview Mode
	private function Preview () : void
	{
		var mf : MeshFilter = goCurTarget.GetComponent( MeshFilter );
		
		if (!script.tmpMesh) {
			script.tmpMesh = new Mesh();
			script.tmpMesh.name = script.sMesh.name + "_" + goCurTarget.name + script.tmpMesh.GetInstanceID();
		}
		
		lodSystem.Calculate( script.tmpMesh );
		UpdateMesh();
		
		//script.tmpMesh.Optimize();
		mf.mesh = script.tmpMesh;
		
		originalMesh = script.sMesh;
		script.tmpMeshName = script.tmpMesh.name;
		previewMeshName = script.tmpMesh.name;
		
		script.isPreview = true;
	};
	
	
	private function PreviewEnd () : void
	{
		if (!goCurTarget.active) return;
		
		var mf : MeshFilter = goCurTarget.GetComponent( MeshFilter );
		mf.sharedMesh = script.sMesh;
		
		DestroyImmediate( script.tmpMesh );
		script.tmpMesh = null;
		script.tmpMeshName = "";
		script.isPreview = false;
	};
	
	
	private function checkSharedMeshIsSet () : void
	{
		var mf : MeshFilter = goCurTarget.GetComponent( MeshFilter );
		if (script.isPreview) {
			if (!script.tmpMesh)
				script.tmpMesh = mf.mesh;
			script.tmpMeshName = mf.sharedMesh.name;
		}
		
		if (!script.sMesh)
			script.sMesh = mf.sharedMesh;
	};
	
	
	public function UpdateMesh () : void
	{
		var previewMesh : Mesh = script.tmpMesh;
		if (lodSystem.finalTriangles.length > previewMesh.triangles.length) {
			previewMesh.vertices = lodSystem.finalVertices;
			previewMesh.normals = lodSystem.finalNormals;
			previewMesh.uv = lodSystem.finalUVs;
			previewMesh.triangles = lodSystem.finalTriangles;
		}
		else {
			previewMesh.triangles = lodSystem.finalTriangles;
			previewMesh.vertices = lodSystem.finalVertices;
			previewMesh.normals = lodSystem.finalNormals;
			previewMesh.uv = lodSystem.finalUVs;
		}
	};
	
	
	private function ClearMeshes () : void
	{
		var tmpObjs : Object = FindObjectsOfType( Mesh );
    for (var tmp : Mesh in tmpObjs) {
			if (tmp.name == previewMeshName)
				DestroyImmediate( tmp );
    }
	};
}
