public var speed : float = 40f;


function Update ()
{
	if(Input.GetKey("d")){
    transform.Rotate(0,0,-speed*Time.deltaTime);
    };
    if(Input.GetKey("a")){
    transform.Rotate(0,0,speed*Time.deltaTime);
    };
}