#pragma strict
var customSkin : GUISkin;
function OnGUI() {
	GUI.skin = customSkin;
 	GUI.Label(Rect (Screen.width/5, 0, Screen.width/2, Screen.height-150),"Styr ballen med A, D og Space!");
	GUI.Label(Rect (Screen.width/3.9, 0, Screen.width/4, Screen.height-85),"Sammle alle steiene.");
	GUI.Label(Rect (0, 0, Screen.width, Screen.height-20),"PS. Steiner synker!");
}