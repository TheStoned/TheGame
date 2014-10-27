#pragma strict
private var displayLabel = false;
private var height = Screen.height;
private var width = Screen.width;

function Start() {
		FlashLabel();
		LoadLevel();
}
 
function FlashLabel() {
     
	while (1) {
		displayLabel = true;
		yield WaitForSeconds(.5);
		displayLabel = false;
		yield WaitForSeconds(.5);
	}	
}

function LoadLevel(){
	var async : AsyncOperation = Application.LoadLevelAsync ("StonedGame");
	yield async; 
}
var customSkin : GUISkin;
function OnGUI() {
	GUI.skin = customSkin;
 	if (displayLabel == true)
 	GUI.Label(Rect (0, 0, width, height),"LOADING");
 
}
