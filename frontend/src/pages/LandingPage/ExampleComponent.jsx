import React from "react";
import { useDispatch } from "react-redux";
import { toggleModal } from "../../redux/actions/modalActions";
import Modal from "../../common/Modal/Modal";

const ExampleComponent = () => {
  const dispatch = useDispatch();

  const handleOpenModal = () => {
    dispatch(toggleModal());
  };

  return (
    <div>
      <button onClick={handleOpenModal}>Open Modal</button>
      <Modal
        title="Example Modal"
        footerButtons={[
          {
            text: "Close",
            variant: "contained",
            onClick: () => dispatch(toggleModal()),
          },
        ]}
      >
        <p>This is an example modal content.</p>
      </Modal>
    </div>
  );
};

export default ExampleComponent;
