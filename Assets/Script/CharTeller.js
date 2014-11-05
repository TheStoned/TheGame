#pragma strict
var customSkin : GUISkin;
var customSkin2 : GUISkin;
private var antall : boolean = true;


private var fpController : CharacterMotor;
fpController = GameObject.Find("First Person Controller").GetComponent(CharacterMotor);

private var rulling : Rulling;
rulling = GameObject.Find("Sphere").GetComponent(Rulling);

var teller : int;
teller = 0;

function OnGUI(){
	GUI.skin = customSkin;
	if(antall){
		GUI.Label(Rect (0, 0, Screen.width, Screen.height), teller +"/28");
	};
	
	if(teller == 28){
		antall = false;
		GUI.skin = customSkin2;
		GameFinnish();
		
		GUI.BeginGroup(Rect(0, 0, Screen.width, Screen.height));
			
			GUI.Label(Rect (0, 0, Screen.width, Screen.height/3), "Gratulerer, du har fullført spillet!");
			if (GUI.Button(Rect(Screen.width/3, Screen.height-60, 100, 60), "Restart")) {
				Application.LoadLevel (Application.loadedLevel);
			};
			if (GUI.Button(Rect(Screen.width/1.5, Screen.height-60, 100, 60), "Quit")) {
				Application.Quit();
			};
		GUI.EndGroup();
		
		
	}
	
}

function GameFinnish(){
	fpController.enabled = false;
	rulling.enabled = false;
}
