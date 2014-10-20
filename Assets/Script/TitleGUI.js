var customSkin : GUISkin;
private var main : boolean = true;
private var graphic : boolean = false;
private var displayLabel = false;
private var teller : int = 5;

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

function OnGUI(){
	GUI.skin = customSkin;
	if (main == true){
		if(GUI.Button(Rect(0, 0, 200, 100), "Play Game!")){
			Application.LoadLevel ("StonedGame");
			main = false;
		};
		if(GUI.Button(Rect(0, 100, 200, 100), "Graphic!")){
			main = false;
			graphic = true;
		};
	};
	if(graphic == true){
		GUI.Label(Rect (0, 150, 200, 100), "Graphic level:  " + teller);
		if (GUI.Button(Rect(0, 0, 200, 100), "Decrease")) {
			QualitySettings.DecreaseLevel();
			teller --;
		};
		if (GUI.Button(Rect(0, 100, 200, 100), "Increase")) {
			QualitySettings.IncreaseLevel();
			teller ++;
		};
		if (teller > 6){
			teller = 6;
		};
		if (teller < 1){
			teller = 1;
		};
		
		if (GUI.Button(Rect(0, Screen.height-75, 150, 75), "Back")) {
			main = true;
			graphic = false;
		};
	};
	
}
