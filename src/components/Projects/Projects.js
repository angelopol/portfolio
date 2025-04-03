import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import ProjectCard from "./ProjectCards";
import Particle from "../Particle";
import EZPASS from "../../Assets/Projects/EZPASSALL.png";
import COLEABG from "../../Assets/Projects/COLEABGALL.png";
import CARNETAPP from "../../Assets/Projects/CARNETAPPALL.png";
import SOULBEAT from "../../Assets/Projects/SOULBEATALL.png";
import BISTROT from "../../Assets/Projects/BISTROTALL.png";
import FINANCY from "../../Assets/Projects/FINANCYALL.png";
import INVENTORY from "../../Assets/Projects/INVENTORYALL.png";

function Projects() {
  return (
    <Container fluid className="project-section">
      <Particle />
      <Container>
        <h1 className="project-heading">
          My Recent <strong className="purple">Works </strong>
        </h1>
        <p style={{ color: "black" }}>
          Here are a few projects I've worked on recently.
        </p>
        <Row style={{ justifyContent: "center", paddingBottom: "10px" }}>
          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={EZPASS}
              isBlog={false}
              title="EZPASS"
              description="Developed a web platform and microcomputer network for accounting and access control using Laravel, Bootstrap, JavaScript, Python, OpenCV, TtkBootstrap and MySQL. Integrated APIs and AWS for scalability. Built Python-based microcomputer software with offline database synchronization."
              demoLink="https://ezpass.cloud/"
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={COLEABG}
              isBlog={false}
              title="Colegio de Abogados del Estado Carabobo Web Site"
              description="Development of a web site for billing queries of the college members. Building with PHP, Bootstrap and Microsoft SQL Server."
              ghLink="https://github.com/angelopol/ColeabgWebPage"
              demoLink="https://coleabg.com/"
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={SOULBEAT}
              isBlog={false}
              title="SOULBEAT"
              description="Backend Developer. Designed MySQL database, developed migrations, models, and controllers in Laravel (MVC). Built real-time messaging with Pusher and sockets, working in an XP-based collaborative environment."
              ghLink="https://github.com/angelopol/Soulbeat"
              demoLink="https://soulbeat-main-aycgth.laravel.cloud/login"              
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={FINANCY}
              isBlog={false}
              title="FINANCY"
              description="Web app to manage your personal finances adapted to the Venezuelan market. Builded with Laravel, React, InertiaJs, Tailwind and MySQL."
              ghLink="https://github.com/angelopol/financy"
              demoLink="https://financy-main-sprvyq.laravel.cloud"
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={BISTROT}
              isBlog={false}
              title="Bistrot Chef Remy"
              description="Backend Developer for Bistrot using NodeJs and Express. Developed user authentication, designed admin and employee templates, and structured routes and controllers. Coordinated backend-frontend integration following Scrum methodology."
              ghLink="https://github.com/angelopol/bistrot"
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={CARNETAPP}
              isBlog={false}
              title="Carnets to Colegio de Abogados del Estado Carabobo"
              description="Make Carnets to the College members using Python, OpenCV, Tkinter and MySQL."
              ghLink="https://github.com/angelopol/ColeabgCarnetApp"
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={INVENTORY}
              isBlog={false}
              title="INVENTORY"
              description="App to manage a simple inventory using Python, Flet and SQLite."
              ghLink="https://github.com/angelopol/inventory"
            />
          </Col>
        </Row>
      </Container>
    </Container>
  );
}

export default Projects;
