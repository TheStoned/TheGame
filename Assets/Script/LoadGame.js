#pragma strict
private var displayLabel = false;
private var ao;

function Start() {
	yield WaitForSeconds(8.0);
	var ao : AsyncOperation = Application.LoadLevelAsync ("StonedGame");
}

var customSkin : GUISkin;
function OnGUI() {
	GUI.skin = customSkin;
 	GUI.Label(Rect (10, 10, Screen.width, Screen.height),"LOADING");
}
