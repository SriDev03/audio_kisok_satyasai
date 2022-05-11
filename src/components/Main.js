import { Container, Row, Col } from "react-bootstrap";
import TopicCard from "./TopicCard";
import { useState, useEffect } from "react";
import "./Main.css";
import data from "../assets/data/data.json";
import bg from "../assets/background.jpg";
import aud_mand from "../assets/aud_mandala.svg";
import lang_mand from "../assets/lang_mandala.svg";
import mandala from "../assets/mandala.svg";

function Main() {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [selectedTop, setselectedTop] = useState("");
  const [selectedAud, setselectedAud] = useState("");

  const topicSelected = (svid) => {
    setselectedTop(svid);
  };
  return (
    <div
      className="text-center"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        height: "100vh",
        // textAlign: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="title">Sri Sathya Sai Speaks</div>
      {!show ? (
        <div>
          <Container fluid className="kalakar">
            <Row>
              {data?.map((item, index) => {
                return (
                  <Col xl={2}>
                    <TopicCard
                      topicId={index}
                      topic={item}
                      handleShow={handleShow}
                      topicSelected={topicSelected}
                    />
                  </Col>
                );
              })}
            </Row>
          </Container>
        </div>
      ) : null}
      {selectedTop ? (
        show ? (
          <>
            <Container className="display_cont">
              <Row>
                <Row style={{ marginLeft: "5px", paddingBottom: "24px" }}>
                  <Col xs lg={2} style={{ textAlign: "end" }}>
                    <img className="mand" src={mandala} alt="" />
                  </Col>
                  <Col xs lg={10} style={{ textAlign: "start" }}>
                    <p className="selectedTop">{selectedTop.title}</p>
                  </Col>
                </Row>
                <Row>
                  {selectedTop?.audios?.map((item, index) => {
                    return (
                      <>
                        <div className="fade_rule"></div>

                        <Col xs lg={2} style={{ textAlign: "end" }}>
                          <img
                            className="play_mand p-2"
                            src={aud_mand}
                            alt=""
                          />
                        </Col>
                        <Col xs lg={10} style={{ textAlign: "start" }}>
                          <p
                            key={index}
                            className={
                              selectedAud === item ? "selectedAud" : "list_item"
                            }
                            onClick={() => {
                              setselectedAud(item);
                            }}
                          >
                            {item}
                          </p>
                        </Col>
                      </>
                    );
                  })}
                </Row>
                <div
                  className="lang"
                  onClick={() => {
                    handleClose();
                    setselectedAud("");
                  }}
                >
                  <img className="lang_mandala" src={lang_mand} alt="..." />
                  <p className="back">BACK</p>
                </div>
              </Row>
            </Container>
          </>
        ) : null
      ) : null}
    </div>
  );
}

export default Main;
