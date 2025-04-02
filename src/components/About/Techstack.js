import React from "react";
import { Col, Row } from "react-bootstrap";
import { CgCPlusPlus } from "react-icons/cg";
import {
  DiComposer,
  DiJavascript1,
  DiReact,
  DiNodejs,
  DiPython,
  DiJava,
  DiPhp,
  DiLaravel,
  DiSass,
  DiBootstrap,
  DiHtml5,
  DiCss3
} from "react-icons/di";
import {
  SiPostgresql,
  SiMysql,
  SiMariadb,
  SiSqlite,
  SiMicrosoftsqlserver,
  SiTailwindcss
} from "react-icons/si";

function Techstack() {
  return (
    <Row style={{ justifyContent: "center", paddingBottom: "50px" }}>
      <Col xs={4} md={2} className="tech-icons">
        <CgCPlusPlus />
        <br />
        <span className="fs-6 ms-auto">C++</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <DiJavascript1 />
        <br />
        <span className="fs-6 ms-auto">JavaScript</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <DiComposer />
        <br />
        <span className="fs-6 ms-auto">Composer</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <DiNodejs />
        <br />
        <span className="fs-6 ms-auto">Node.js</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <DiReact />
        <br />
        <span className="fs-6 ms-auto">React</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <DiPython />
        <br />
        <span className="fs-6 ms-auto">Python</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <DiJava />
        <br />
        <span className="fs-6 ms-auto">Java</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <DiPhp />
        <br />
        <span className="fs-6 ms-auto">PHP</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <DiLaravel />
        <br />
        <span className="fs-6 ms-auto">Laravel</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <DiSass />
        <br />
        <span className="fs-6 ms-auto">Sass</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <DiBootstrap />
        <br />
        <span className="fs-6 ms-auto">Bootstrap</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <DiHtml5 />
        <br />
        <span className="fs-6 ms-auto">HTML5</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <DiCss3 />
        <br />
        <span className="fs-6 ms-auto">CSS3</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiPostgresql />
        <br />
        <span className="fs-6 ms-auto">PostgreSQL</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiMysql />
        <br />
        <span className="fs-6 ms-auto">MySQL</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiMariadb />
        <br />
        <span className="fs-6 ms-auto">MariaDB</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiSqlite />
        <br />
        <span className="fs-6 ms-auto">SQLite</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiMicrosoftsqlserver />
        <br />
        <span className="fs-6 ms-auto">SQL Server</span>
      </Col>
      <Col xs={4} md={2} className="tech-icons">
        <SiTailwindcss />
        <br />
        <span className="fs-6 ms-auto">Tailwind</span>
      </Col>
    </Row>
  );
}

export default Techstack;
