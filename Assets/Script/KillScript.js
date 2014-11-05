#pragma strict
private var toggleLabel : boolean = false;
var customSkin : GUISkin;
private var fpController : CharacterMotor;
fpController = GameObject.Find("First Person Controller").GetComponent(CharacterMotor);

private var rulling : Rulling;
rulling = GameObject.Find("Sphere").GetComponent(Rulling);

function OnTriggerEnter (collision : Collider){
	fpController.enabled = false;
	rulling.enabled = false;
	toggleLabel = true;
	yield WaitForSeconds(10.0);
	Application.LoadLevel (Application.loadedLevel);
}


function OnGUI(){
	if(toggleLabel){
		GUI.skin = customSkin;
				GUI.BeginGroup(Rect(0, 0, Screen.width, Screen.height));
			
			GUI.Label(Rect (0, 0, Screen.width, Screen.height/3), "Du har dødd! Prøv igjen!");
			if (GUI.Button(Rect((Screen.width/3)-100, Screen.height-100, 150, 100), "Restart")) {
				Application.LoadLevel (Application.loadedLevel);
			};
			if (GUI.Button(Rect((Screen.width/1.5)-100, Screen.height-100, 150, 100), "Quit")) {
				Application.LoadLevel ("StonedMenu");
			};
		GUI.EndGroup();
	}
}