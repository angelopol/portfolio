import React, { useState, useEffect } from "react";
import { Container, Row, Button } from "react-bootstrap";
import Particle from "../Particle";
import pdf from "../../Assets/CV - Angelo Polgrossi - English.pdf";
import { AiOutlineDownload } from "react-icons/ai";
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack';

function ResumeNew() {
  const [width, setWidth] = useState(1200);
 
  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);

  return (
    <div>
      <Container fluid className="resume-section">
        <Particle />
        <Row style={{ justifyContent: "center", position: "relative" }}>
          <Button
            variant="primary"
            href={pdf}
            target="_blank"
            style={{ maxWidth: "250px" }}
          >
            <AiOutlineDownload />
            &nbsp;Download CV
          </Button>
        </Row>

        <Row className="resume">
            <Document file={pdf} className="d-flex justify-content-center">
              <Page pageNumber={1} scale={width > 786 ? 1.7 : 0.6} />
           </Document>
           <Document file={pdf} className="d-flex justify-content-center">
              <Page pageNumber={2} scale={width > 786 ? 1.7 : 0.6} />
           </Document>
        </Row>

        <Row style={{ justifyContent: "center", position: "relative" }}>
          <Button
            variant="primary"
            href={pdf}
            target="_blank"
            style={{ maxWidth: "250px" }}
          >
            <AiOutlineDownload />
            &nbsp;Download CV
          </Button>
        </Row>
      </Container>
    </div>
  );
}

export default ResumeNew;