private var meny : boolean = false;
var customSkin : GUISkin;

function OnGUI(){
	GUI.skin = customSkin;
	if (meny == true){
		RestartMenu();
	}
}

function Update(){
	if(Input.GetKeyUp(KeyCode.Escape)){
		Debug.Log("Test1");
		if (meny == false){
			meny = true;
		} else{
			meny = false;
		};
	};
}

function RestartMenu(){
GUI.BeginGroup(Rect(Screen.width/3, Screen.height/5, Screen.width/3, Screen.height/1.5));
GUI.Box (new Rect(0, 0, Screen.width/3, Screen.height/1.5), "Menu");
	if (GUI.Button(Rect(0, 75, Screen.width/3, 50), "Restart")) {
		Application.LoadLevel (Application.loadedLevel);
	};
GUI.EndGroup();
}