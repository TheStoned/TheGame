#pragma strict
var customSkin : GUISkin;

var teller : int;
teller = 0;

function OnGUI(){
	GUI.skin = customSkin;
	GUI.Label(Rect (0, 0, Screen.width, Screen.height), teller +" steiner samlet av: 300");
}