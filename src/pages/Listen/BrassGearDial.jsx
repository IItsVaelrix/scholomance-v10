export default function BrassGearDial({ school, onTune, disabled }) {

  const handleClick = () => {
    if (disabled) return;
    onTune?.();
  };

  return (
    <div className="brass-dial-container">
      {/* Outer gear ring */}
      <div className="gear-ring">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="gear-tooth"
            style={{ transform: `rotate(${i * 15}deg) translateY(-108px)` }}
          />
        ))}
      </div>

      {/* Main dial */}
      <div
        className="brass-dial"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`Tune to ${school} frequency`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* Dial face engravings */}
        <div className="dial-engravings">
          {["VOID", "PSYCH", "ALCH", "WILL", "SONIC"].map((label, i) => (
            <span
              key={label}
              className="dial-marking"
              style={{ transform: `rotate(${i * 72}deg) translateY(-65px)` }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Center knob */}
        <div className="dial-center">
          <div className="dial-knob">
            <div className="knob-grip" />
            <div className="knob-grip" style={{ transform: "rotate(60deg)" }} />
            <div className="knob-grip" style={{ transform: "rotate(120deg)" }} />
          </div>
        </div>

        {/* Needle indicator */}
        <div className="dial-needle" />
      </div>

      {/* Decorative rivets */}
      {[0, 90, 180, 270].map((rot) => (
        <div
          key={rot}
          className="rivet rivet--dial"
          style={{ transform: `rotate(${rot}deg) translateY(-95px)` }}
        />
      ))}
    </div>
  );
}
