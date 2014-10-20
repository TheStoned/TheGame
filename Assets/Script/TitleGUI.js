var customSkin : GUISkin;

function OnGUI(){
	GUI.skin = customSkin;
	if(GUI.Button(Rect(0, 0, 200, 100), "Click me 1!")){
		Application.LoadLevel ("StonedGame");
	};

}