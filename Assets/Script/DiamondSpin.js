public var speed : float = 40f;


function Update ()
{
    transform.Rotate(0,0,speed*Time.deltaTime);
}