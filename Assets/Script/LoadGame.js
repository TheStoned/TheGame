#pragma strict
private var displayLabel = false;
private var height = Screen.height;
private var width = Screen.width;

function Start() {
FlashLabel();
}
 
function FlashLabel() {
   
// Fancy pants flash of label on and off   
	while (1) {
		displayLabel = true;
		yield WaitForSeconds(.5);
		displayLabel = false;
		yield WaitForSeconds(.5); 
	}
 
}
var customSkin : GUISkin;
function OnGUI() {
	GUI.skin = customSkin;
 	if (displayLabel == true)
 	GUI.Label(Rect (0, 0, width, height),"LOADING");
 
}
