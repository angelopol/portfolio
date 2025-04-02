import React from "react";
import { Col, Row } from "react-bootstrap";
import {
  SiVisualstudiocode,
  SiPostman,
  SiVercel,
  SiDebian,
  SiLinux,
  SiAmazonaws,
  SiArduino,
  SiNginx,
  SiXampp,
  SiDocker,
  SiGit,
  SiGithub,
  SiJupyter,
  SiFigma
} from "react-icons/si";

function Toolstack() {
  return (
    <Row style={{ justifyContent: "center", paddingBottom: "20px" }}>
      <Col xs={4} md={2} className="tech-icons">
        <SiVisualstudiocode />
        <br/>
        <span className="fs-6 ms-auto">Visual Studio Code</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiPostman />
        <br/>
        <span className="fs-6 ms-auto">Postman</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiVercel />
        <br/>
        <span className="fs-6 ms-auto">Vercel</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiDebian />
        <br/>
        <span className="fs-6 ms-auto">Debian</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiLinux />
        <br/>
        <span className="fs-6 ms-auto">Linux</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiAmazonaws />
        <br/>
        <span className="fs-6 ms-auto">AWS</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiArduino />
        <br/>
        <span className="fs-6 ms-auto">Arduino</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiNginx />
        <br/>
        <span className="fs-6 ms-auto">Nginx</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiXampp />
        <br/>
        <span className="fs-6 ms-auto">XAMPP</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiDocker />
        <br/>
        <span className="fs-6 ms-auto">Docker</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiGit />
        <br/>
        <span className="fs-6 ms-auto">Git</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiGithub />
        <br/>
        <span className="fs-6 ms-auto">GitHub</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiFigma />
        <br/>
        <span className="fs-6 ms-auto">Figma</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiJupyter />
        <br/>
        <span className="fs-6 ms-auto">Jupyter</span>
      </Col>
    </Row>
  );
}

export default Toolstack;
