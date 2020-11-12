import {
    Animation,
    AnimationGroup,
    Camera,
    EasingFunction,
    float,
    QuadraticEase,
    Scene,
    TransformNode,
    UniversalCamera,
    Vector3,
  } from "babylonjs";
  
  export class CameraState {
    public position: Vector3;
    public pitch: float;
    public rotation: float;
    public translation: float;
    public constructor(
      position: Vector3,
      pitch: float,
      rotation: float,
      translation: float
    ) {
      this.position = position;
      this.pitch = pitch;
      this.rotation = rotation;
      this.translation = translation;
    }
  }
  
  export class CameraRig {
    private _root: TransformNode;
    private _pitch: TransformNode;
    private _cam: UniversalCamera;
    private _pitchAngle: float;
    private _rotAngle: float;
    private _currentAnimGrp: AnimationGroup;
    private _targetCam: CameraRig;
    public constructor(
      scene: Scene,
      name: string,
      pitchAngle: float = 45,
      rotAngle: float = 0.0
    ) {
      this._cam = new UniversalCamera(name, new Vector3(0.0, 0.0, 0.0), scene);
      this._root = new TransformNode(name + "_tm", scene);
      this._root.position = new Vector3(0.0, 40.0, -40.0);
      this._pitch = new TransformNode(name + "_pitch", scene);
      this.pitchAngle = pitchAngle;
      this.rotAngle = rotAngle;
      this._cam.parent = this._pitch;
      this._pitch.parent = this._root;
      this._cam.fov = 0.55;
      this._cam.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
      this._cam.maxZ = 3000;
      this._cam.minZ = 40;
      this._currentAnimGrp = undefined;
    }
  
    get root(): TransformNode {
      return this._root;
    }
  
    get cam(): UniversalCamera {
      return this._cam;
    }
  
    get pitchAngle(): float {
      return this.radianToEuler(this._pitchAngle);
    }
  
    set pitchAngle(newAngle: float) {
      this._pitchAngle = this.eulerToRadian(newAngle);
      this._pitch.rotation = new Vector3(this._pitchAngle, this._rotAngle, 0.0);
    }
  
    get rotAngle(): float {
      return this.radianToEuler(this._rotAngle);
    }
  
    set rotAngle(newAngle) {
      this._rotAngle = this.eulerToRadian(newAngle);
      this._pitch.rotation = new Vector3(this._pitchAngle, this._rotAngle, 0.0);
    }
  
    private radianToEuler(rads: float): float {
      return (rads * 180) / Math.PI;
    }
  
    private eulerToRadian(euler: float): float {
      return (euler * Math.PI) / 180;
    }
  
    public setState(state: CameraState) {
      this.root.position = state.position;
      this._pitchAngle = state.pitch;
      this._rotAngle = state.rotation;
      this._pitch.rotation.x = this._pitchAngle;
      this._pitch.rotation.y = this._rotAngle;
      this._cam.position.z = state.translation;
    }
  
    public getState(): CameraState {
      return new CameraState(
        this.root.position.clone(),
        this._pitch.rotation.x,
        this._pitch.rotation.y,
        this._cam.position.z
      );
    }
  
    public GetTargetAnimGrpTo(state: CameraState): AnimationGroup {
      let positionKeys = [
        {
          frame: 0,
          value: this._root.position,
        },
        {
          frame: 60,
          value: state.position,
        },
      ];
      let pitchKeys = [
        {
          frame: 0,
          value: this._pitch.rotation,
        },
        {
          frame: 60,
          value: new Vector3(state.pitch, state.rotation, this._pitch.rotation.z),
        },
      ];
      let camKeys = [
        {
          frame: 0,
          value: this._cam.position,
        },
        {
          frame: 60,
          value: new Vector3(
            this._cam.position.x,
            this._cam.position.y,
            state.translation
          ),
        },
      ];
  
      let position: Animation = new Animation(
        "cam_root_position",
        "position",
        60,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      let pitch: Animation = new Animation(
        "cam_pitch_rotation",
        "rotation",
        60,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      let translation: Animation = new Animation(
        "cam_translation",
        "position",
        60,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      position.setKeys(positionKeys);
      pitch.setKeys(pitchKeys);
      translation.setKeys(camKeys);
  
      let easingF = new QuadraticEase();
      easingF.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
      position.setEasingFunction(easingF);
      pitch.setEasingFunction(easingF);
      translation.setEasingFunction(easingF);
      let AnimGrp = new AnimationGroup("cam_anim");
      AnimGrp.addTargetedAnimation(position, this._root);
      AnimGrp.addTargetedAnimation(pitch, this._pitch);
      AnimGrp.addTargetedAnimation(translation, this._cam);
      AnimGrp.normalize();
      return AnimGrp;
    }
  
    public play(anim: AnimationGroup, time: float) {
      if (this._currentAnimGrp === undefined) this._currentAnimGrp = anim;
      else {
        if (this._currentAnimGrp.isPlaying) this._currentAnimGrp.stop();
        this._currentAnimGrp.dispose();
        this._currentAnimGrp = anim;
      }
      anim.speedRatio = 1 / time;
      return anim.play(false);
    }
  }
  