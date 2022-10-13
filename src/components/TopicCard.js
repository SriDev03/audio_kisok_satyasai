import "./Main.css";
import mandala from "../assets/mandala.png";

function TopicCard({ topicId, topic, topicSelected, handleShow }) {
  return (
    <>
      <div
        id={topicId}
        className="topic_card p-3"
        key={topic.id}
        onClick={() => {
          topicSelected(topic);
          handleShow(false);
        }}
      >
        <div className="mx-auto text-center">
          <img className="mandala" src={mandala} alt="" />
        </div>

        <div>
          <div className="topic_title font-eng p-3">{topic.title}</div>
        </div>
      </div>
    </>
  );
}

export default TopicCard;
