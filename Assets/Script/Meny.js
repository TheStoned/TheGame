﻿private var meny : boolean = false;
private var mainMeny : boolean = true;
var customSkin : GUISkin;
private var teller : int = 5;
private var graphicMenu : boolean = false;

private var fpController : CharacterMotor;
fpController = GameObject.Find("First Person Controller").GetComponent(CharacterMotor);

private var rulling : Rulling;
rulling = GameObject.Find("Sphere").GetComponent(Rulling);

function OnGUI(){
	GUI.skin = customSkin;
	GUI.BeginGroup(Rect(Screen.width/3, Screen.height/5, Screen.width/3, Screen.height/1.5));
	if (meny == true){
		RestartMenu();
	}
	if (graphicMenu == true){
		GraphicMenu();
	};
	GUI.EndGroup();
}

function Update(){
	if(Input.GetKeyUp(KeyCode.Escape)){
		Pause();
		Debug.Log("Test1");
		if (meny == false){
			meny = true;
		} else{
			meny = false;
			mainMeny=true;
			graphicMenu = false;
		};
	};
}

function RestartMenu(){
if(mainMeny == true){

GUI.Box (new Rect(0, 0, Screen.width/3, Screen.height/1.5), "Menu");
		if (GUI.Button(Rect(0, 150, Screen.width/3, 100), "Restart")) {
			Application.LoadLevel (Application.loadedLevel);
		};
		if (GUI.Button(Rect(0, 250, Screen.width/3, 100), "Graphic")) {
			mainMeny = false;
			graphicMenu = true;
		};
		if (GUI.Button(Rect(0,350, Screen.width/3, 100), "Quit")) {
			Application.LoadLevel ("StonedMenu");
		};
	};

}

function GraphicMenu(){
if(graphicMenu== true){
GUI.Box (new Rect(0, 0, Screen.width/3, Screen.height/1.5), "Menu");
	GUI.Label(Rect (0, 100, Screen.width/3, 50), "Graphic level:  " + teller);
	if (GUI.Button(Rect(0, 150, Screen.width/3, 50), "Decrease")) {
		QualitySettings.DecreaseLevel();
		teller --;
	};
	if (GUI.Button(Rect(0, 225, Screen.width/3, 50), "Increase")) {
		QualitySettings.IncreaseLevel();
		teller ++;
	};
	if (teller > 6){
		teller = 6;
	};
	if (teller < 1){
		teller = 1;
	};
		
	if (GUI.Button(Rect(0, 300, Screen.width/3, 50), "Back")) {
		mainMeny = true;
		graphicMenu = false;
	};
};
}

function Pause(){
	if(fpController.enabled == true){
		fpController.enabled = false;
		rulling.enabled = false;
	} else {
		fpController.enabled = true;
		rulling.enabled = true;
	}
}