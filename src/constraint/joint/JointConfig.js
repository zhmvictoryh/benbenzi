/**
* A joint configuration holds all configuration data for constructing a joint.
* Joint configurations can be reused safely.
* @author saharan
*/
OIMO.JointConfig = function(){
	// The first rigid body of the joint.
    this.body1 = null;
    // The second rigid body of the joint.
    this.body2 = null;
    // The anchor point on the first rigid body in local coordinate system.
    this.localAnchorPoint1 = new OIMO.Vec3();
    //  The anchor point on the second rigid body in local coordinate system.
    this.localAnchorPoint2 = new OIMO.Vec3();
    // The axis in the first body's coordinate system.
	// his property is available in some joints.
    this.localAxis1 = new OIMO.Vec3();
    // The axis in the second body's coordinate system.
	// This property is available in some joints.
    this.localAxis2 = new OIMO.Vec3();
    //  Whether allow collision between connected rigid bodies or not.
    this.allowCollision = false;

};