import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import Tilt from "react-parallax-tilt";
import { AiFillGithub } from "react-icons/ai";
import { FaLinkedinIn } from "react-icons/fa";

function Home2() {
  return (
    <Container fluid className="home-about-section" id="about">
      <Container>
        <Row>
          <Col md={8} className="home-about-description">
            <h1 style={{ fontSize: "2.6em" }}>
              LET ME <span className="purple"> INTRODUCE </span> MYSELF
            </h1>
            <p className="home-about-body">
              Advanced student of <b className="purple">computer engineering</b> with experience developing any type of <b className="purple">web applications</b>, 
              management systems for companies in the cloud or local, software for <b className="purple">microcontrollers</b> and other types of applications. 
              I consider myself a developer focused on the <b className="purple">backend</b>, but still has skills in several areas. 
              I am open to participate in any kind of project, learn and contribute all my knowledge to achieve the best possible result.
            </p>
          </Col>
          <Col md={4} className="myAvtar">
            Y<Tilt>
              <img
                src={"https://media.licdn.com/dms/image/v2/D4E35AQFsTJpEne8fIQ/profile-framedphoto-shrink_400_400/B4EZX2iYm7HUAc-/0/1743597963998?e=1744214400&v=beta&t=nrCAeabTE2mXx0r6V76v2HUxTu7ZeBHKwAn668JFErI"}
                className="img-fluid rounded-circle w-50 h-50"
                alt="avatar"
              />
            </Tilt>
          </Col>
        </Row>
      </Container>
    </Container>
  );
}
export default Home2;
