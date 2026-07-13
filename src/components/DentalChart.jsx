import React from 'react';
import './DentalChart.css';

const DentalChart = ({ onSelectTooth }) => {
  // FDI World Dental Federation notation
  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38];
  const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41];

  const renderTooth = (num) => (
    <div key={num} className="tooth-wrapper" onClick={() => onSelectTooth(num)}>
      <div className="tooth-icon">
        {/* Simple visual representation of a tooth */}
        <div className="tooth-crown"></div>
        <div className="tooth-root"></div>
      </div>
      <span className="tooth-number">{num}</span>
    </div>
  );

  return (
    <div className="dental-chart-container">
      <div className="jaw upper-jaw">
        <div className="quadrant right-quadrant">
          {upperRight.map(renderTooth)}
        </div>
        <div className="quadrant-divider"></div>
        <div className="quadrant left-quadrant">
          {upperLeft.map(renderTooth)}
        </div>
      </div>
      
      <div className="jaw-divider"></div>
      
      <div className="jaw lower-jaw">
        <div className="quadrant right-quadrant">
          {lowerRight.map(renderTooth)}
        </div>
        <div className="quadrant-divider"></div>
        <div className="quadrant left-quadrant">
          {lowerLeft.map(renderTooth)}
        </div>
      </div>
    </div>
  );
};

export default DentalChart;
