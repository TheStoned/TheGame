var customSkin : GUISkin;
private var main : boolean = true;
private var graphic : boolean = false;
private var displayLabel = false;
private var teller : int = 5;
var async : AsyncOperation;

function OnGUI(){
	GUI.skin = customSkin;
	if (main == true){
		MainMenu();
	};
	if(graphic == true){
		GraphicMenu();
	};
	
}
function GraphicMenu(){
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
}

function MainMenu(){
	if(GUI.Button(Rect(0, 0, 200, 100), "Play Game!")){
		GUI.Label(Rect (0, 0, 200, 100), "Loading");
		main = false;
		LoadLevel();
	};
	if(GUI.Button(Rect(0, 100, 200, 100), "Graphic!")){
		main = false;
		graphic = true;
	};

}

function Start () {
		// Load the level named "MyBigLevel".
		async = Application.LoadLevelAsync("LoadingScreen");
		Debug.Log(async.progress);
		async.allowSceneActivation = false;
		Debug.Log ("Loading complete");
	};

function LoadLevel(){
		async.allowSceneActivation = true;
}
