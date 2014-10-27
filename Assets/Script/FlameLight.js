var minLightIntensity: float = 0.5;
var maxLightIntensity: float = 2.0;
var minVariationFactor: float = 0.9; //1.0 => no variation
var maxVariationFactor: float = 1.1; //...
var speedFactor: float = 2.0; //1.0 => normal speed
private var variationFactor: float;
 
function Start()
{
    FixedUpdate();
}
 
function FixedUpdate()
{
    // Slightly randomize the effect every deltaTime to create a flicker effect
    variationFactor = Random.Range(minVariationFactor, maxVariationFactor);
}
 
function Update()
{  
    // Set the intensity by fading between min- and maxLightIntensity,
    // while also applying speedFactor and variationFactor to the mix
    gameObject.GetComponent(Light).intensity = (minLightIntensity
        + Mathf.PingPong(Time.time * speedFactor, maxLightIntensity)) * variationFactor;
}