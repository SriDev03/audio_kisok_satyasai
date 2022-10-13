import { Container, Row, Col } from "react-bootstrap";
import TopicCard from "./TopicCard";
import { useState, useEffect } from "react";
import "./Main.css";

import data from "../assets/data/data.json";
import bg from "../assets/background1.jpg";
import aud_mand from "../assets/aud_mandala.png";
import lang_mand from "../assets/lang_mandala.svg";
import mandala from "../assets/mandala.png";
const { ipcRenderer } = window.require("electron");

function Main() {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [selectedTop, setselectedTop] = useState("");
  const [selectedAud, setselectedAud] = useState("");
  const [selectedMusic, setselectedMusic] = useState("");
  const [audNum, setAudNum] = useState();
  const [isPlaying, setIsPlaying] = useState(false);

  // let time_stamp = document.getElementById("audioTime")?.currentTime;

  const topicSelected = (svid) => {
    setselectedTop(svid);
  };

  const handleTimestamp = (aud_num) => {};

  useEffect(() => {
    const intervalId = setInterval(() => {
      let time_stamp = document.getElementById("audioTime")?.currentTime;
      if (isPlaying) {
        ipcRenderer.invoke(
          "timestamp",
          audNum + " " + time_stamp + " " + "run"
        );
      } else {
        ipcRenderer.invoke("timestamp", 0 + " " + 0 + " " + "halt");
      }
    }, 10);

    return () => clearInterval(intervalId);
  }, [audNum, isPlaying]);
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
      unselectable="on"
      onselectstart="return false;"
      onmousedown="return false;"
    >
      {/* <div className="title">Sri Sathya Sai Speaks</div> */}
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
            <Container className="display_host">
              <Row className="display_cont">
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
                            onClick={() => {
                              setselectedAud(item.topic_name);
                              setselectedMusic(item.aud);
                              setAudNum(item.aud_num);
                            }}
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
                              setAudNum(item.aud_num);
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
                    setIsPlaying(false);
                    ipcRenderer
                      .invoke("broadcast", 0 + " " + 0 + " " + "halt")
                      .then((result) => {
                        // ...
                        //console.log(result);
                      });
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
              onPlay={() => {
                ipcRenderer
                  .invoke("broadcast", audNum + " " + 0 + " " + "run")
                  .then((result) => {
                    // ...
                    //console.log(result);
                  });
                setIsPlaying(true);
              }}
              id="audioTime"
              src={selectedMusic}
              controls={false}
              autoPlay
              onEnded={() => {
                ipcRenderer.invoke("timestamp", 0 + " " + 0 + " " + "halt");
                setIsPlaying(false);
                setselectedAud("");
                ipcRenderer
                  .invoke("broadcast", 0 + " " + 0 + " " + "halt")
                  .then((result) => {
                    // ...
                    //console.log(result);
                  });
              }}
            ></audio>
          </>
        ) : null
      ) : null}
    </div>
  );
}

export default Main;
