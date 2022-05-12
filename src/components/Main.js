import { Container, Row, Col } from "react-bootstrap";
import TopicCard from "./TopicCard";
import { useState, useEffect } from "react";
import "./Main.css";
import ReactAudioPlayer from "react-audio-player";
import data from "../assets/data/data.json";
import bg from "../assets/background.jpg";
import aud_mand from "../assets/aud_mandala.svg";
import lang_mand from "../assets/lang_mandala.svg";
import mandala from "../assets/mandala.svg";
const { ipcRenderer } = window.require("electron");

function Main() {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [selectedTop, setselectedTop] = useState("");
  const [selectedAud, setselectedAud] = useState("");
  const [selectedMusic, setselectedMusic] = useState("");

  let time_stamp = document.getElementById("audioTime")?.currentTime;

  const topicSelected = (svid) => {
    setselectedTop(svid);
  };

  const handleTimestamp = () => {
    setInterval(() => {
      time_stamp = document.getElementById("audioTime")?.currentTime;
      if (document.getElementById("audioTime")?.play == true) {
        ipcRenderer.invoke("timestamp", 0 + " " + time_stamp + " " + "run");
      } else {
        ipcRenderer.invoke("timestamp", 0 + " " + 0 + " " + "halt");
      }
    }, 1000);
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
                        {console.log(item)}
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
                              selectedAud === item.topic_name
                                ? "selectedAud"
                                : "list_item"
                            }
                            onClick={() => {
                              setselectedAud(item.topic_name);
                              setselectedMusic(item.aud);
                              handleTimestamp();
                            }}
                          >
                            {item.topic_name}
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
                    setselectedMusic("");
                  }}
                >
                  <img className="lang_mandala" src={lang_mand} alt="..." />
                  <p className="back">BACK</p>
                </div>
              </Row>
            </Container>
            {/* <audio controls autoPlay>
              <source src={selectedMusic} type="audio/mpeg" />
            </audio> */}

            <audio
              onPlay={() =>
                ipcRenderer
                  .invoke("broadcast", 0 + " " + 0 + " " + "run")
                  .then((result) => {
                    // ...
                    //console.log(result);
                  })
              }
              id="audioTime"
              src={selectedMusic}
              controls
              autoPlay
              onEnded={() => {
                ipcRenderer.invoke("timestamp", 0 + " " + 0 + " " + "halt");
              }}
            ></audio>
          </>
        ) : null
      ) : null}
    </div>
  );
}

export default Main;
