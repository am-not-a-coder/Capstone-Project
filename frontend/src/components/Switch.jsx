import styled from 'styled-components';

const Switch = ({isChecked, onChange}) => {
  return (
    <StyledWrapper>
      <label className="switch">
        <input 
        type="checkbox"
        checked={isChecked}
        onChange={onChange}
        />
        <span className="slider" />
      </label>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .slider {
    background-color: #ffffff2b;
    border-radius: 100px;
    padding: 1px;
    margin-right: 20px;
    cursor: pointer;
    transition: box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0s;
    align-items: center;
    position: relative;
    display: block;
    width: 41px;
    height: 19px;
    box-shadow: rgba(0, 0, 0, 0.62) 0px 0px 5px inset, rgba(0, 0, 0, 0.21) 0px 0px 0px 24px inset,
          #22cc3f 0px 0px 0px 0px inset, rgba(224, 224, 224, 0.45) 0px 1px 0px 0px;
  }

  .slider::after {
    content: "";
    display: flex;
    top: 2.3px;
    left: 2px;
    width: 16px;
    height: 16px;
    background-color: #e3e3e3;
    border-radius: 200px;
    position: absolute;
    box-shadow: transparent 0px 0px 0px 2px, rgba(0, 0, 0, 0.3) 0px 6px 6px;
    transition: left 300ms cubic-bezier(0.4, 0, 0.2, 1) 0s, background-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0s;
    will-change: left, background-color;
  }

  .switch input[type="checkbox"]:checked + .slider {
    box-shadow: rgba(0, 0, 0, 0.62) 0px 0px 5px inset, #22cc3f 0px 0px 0px 2px inset, #22cc3f 0px 0px 0px 24px inset,
          rgba(224, 224, 224, 0.45) 0px 1px 0px 0px;
  }

  .switch input[type="checkbox"]:checked + .slider::after {
    left: 24px;
  }

  .switch input[type="checkbox"] {
    display: none;
  }`;

export default Switch;
