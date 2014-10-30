#pragma strict
private var teller : int;
private var charTeller : CharTellerMeny;
charTeller = GameObject.Find("Sphere").GetComponent(CharTellerMeny);
private var object = GameObject;


function OnTriggerEnter (collision : Collider){
	Destroy(gameObject);
	teller = charTeller.teller;
	Debug.Log(teller);
	teller ++;
	charTeller.teller = teller;
	

}