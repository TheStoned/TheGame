#pragma strict
private var displayLabel = false;
private var height = Screen.height;
private var width = Screen.width;
private var ao;

function Start() {
	var ao : AsyncOperation = Application.LoadLevelAsync ("StonedGame");
}

var customSkin : GUISkin;
function OnGUI() {
	GUI.skin = customSkin;
 	GUI.Label(Rect (0, 0, width, height),"LOADING");
}
