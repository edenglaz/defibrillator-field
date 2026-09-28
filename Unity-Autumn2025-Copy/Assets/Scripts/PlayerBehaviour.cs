using UnityEngine;

public class PlayerBehaviour : MonoBehaviour
{
    public GameObject player_camera; // connect in Unity!!
    float speed = 20;
    float angular_speed = 200;
    CharacterController controller;
    
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {// connects to the component in Unity
        controller = GetComponent<CharacterController>();
        
    }

    // Update is called once per frame
    void Update()
    {
       float rotation_about_x =
             Input.GetAxis("Mouse Y") * angular_speed * Time.deltaTime;

       float rotation_about_y =
             Input.GetAxis("Mouse X") * angular_speed * Time.deltaTime;

     // rotate camera
        player_camera.transform.Rotate(new Vector3(-rotation_about_x,0,0));

     // rotate player
        transform.Rotate(new Vector3(0, rotation_about_y, 0));

        float dz = Input.GetAxis("Vertical")*speed*Time.deltaTime;
        float dx = Input.GetAxis("Horizontal")*speed*Time.deltaTime;

        // absolute motion(not adaptive)
        //  transform.Translate(new Vector3(dx,0,dz));

        // we use the definitions in local cordinates
        Vector3 motion = new Vector3(dx,-0.5f,dz);

        // converts local cordinates into global cordinates
        motion = transform.TransformDirection(motion);
        controller.Move(motion); // uses global cordinates


    }
}
