
const BALL_ACTIONS = ["takePossession", "startDribble", "passBall", "launchBall"];

const _C = 0;

const no = 1;

function getTeamAssignment(i) {
  return i ? { playerTeam: 0, botTeam: 1 } : { playerTeam: 1, botTeam: 0 };
}

const STATE_LAYOUT = { TICK: 0, GOAL: 1, NUM_CARS: 2, NUM_PADS: 3, BALL: 4, CARS: 22 };

const CAR_STATE_STRIDE = 51;

const kf = 8;

const u0 = 8;

const ro = STATE_LAYOUT.CARS + u0 * CAR_STATE_STRIDE;

const CAR_STATE = {
    POS: 0,
    FWD: 3,
    RIGHT: 6,
    UP: 9,
    VEL: 12,
    ANG_VEL: 15,
    BOOST: 18,
    ON_GROUND: 19,
    SUPERSONIC: 20,
    DEMOED: 21,
    HAS_FLIP_OR_JUMP: 22,
    IS_BOOSTING: 23,
    IS_FLIPPING: 24,
    FLIP_RESET_SERIAL: 25,
    WHEELS: 26,
    GROUND_NORMAL: 38,
    JUMP_SERIAL: 41,
    DODGE_SERIAL: 42,
    DOUBLE_JUMP_SERIAL: 43,
    WHEEL_IMPACT_SERIAL: 44,
    WHEEL_IMPACT_SPEED: 45,
    BALL_HIT_SERIAL: 46,
    BALL_HIT_SPEED: 47,
    BALL_WORLD_IMPACT_SERIAL: 48,
    BALL_WORLD_IMPACT_SPEED: 49,
    BALL_WORLD_SURFACE: 50,
  };

const EC = 3;

export { BALL_ACTIONS, CAR_STATE, CAR_STATE_STRIDE, EC, STATE_LAYOUT, _C, getTeamAssignment, kf, no, ro, u0 };
