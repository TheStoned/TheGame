function OnGUI(){
		if(GUI.Button(Rect(0, 0, 200, 100), "Click me 1!")){
			Application.LoadLevel ("StonedGame");
			tst = false;
		};
	
	if (GUI.Button(Rect(50, 50, 200, 100), "Decrease")) {
		QualitySettings.DecreaseLevel();
	};
	if (GUI.Button(Rect(200, 200, 200, 100), "Increase")) {
		QualitySettings.IncreaseLevel();
	};
}