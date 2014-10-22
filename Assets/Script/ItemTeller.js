#pragma strict
private var teller : int;
private var charTeller : CharTeller;
charTeller = GameObject.Find("Sphere").GetComponent(CharTeller);
private var object = GameObject;


function OnTriggerEnter (collision : Collider){
	Destroy(gameObject);
	teller = charTeller.teller;
	Debug.Log(teller);
	teller ++;
	charTeller.teller = teller;
	

}