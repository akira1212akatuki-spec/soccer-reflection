"use client";

import React from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { Evaluation } from '@/lib/storage';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface RadarChartProps {
  currentEvaluation: Evaluation;
  averageEvaluation: Evaluation;
  showLegend?: boolean;
}

export default function RadarChart({ currentEvaluation, averageEvaluation, showLegend = false }: RadarChartProps) {
  const labels = [
    'チャレンジ',
    'トランジション',
    'インテリジェンス',
    'ハードワーク',
    'メンタル',
    'キャプテンシー'
  ];

  const currentData = [
    currentEvaluation.challenge,
    currentEvaluation.transition,
    currentEvaluation.intelligence,
    currentEvaluation.hardwork,
    currentEvaluation.mental,
    currentEvaluation.captaincy,
  ];

  const averageData = [
    averageEvaluation.challenge,
    averageEvaluation.transition,
    averageEvaluation.intelligence,
    averageEvaluation.hardwork,
    averageEvaluation.mental,
    averageEvaluation.captaincy,
  ];

  const data: ChartData<'radar'> = {
    labels,
    datasets: [
      {
        label: '今回の分析',
        data: currentData,
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.5)', // slightly darker
        borderColor: 'rgb(59, 130, 246)',
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)',
        borderWidth: 3,
      },
      {
        label: '平均値',
        data: averageData,
        fill: false,
        borderDash: [5, 5],
        backgroundColor: 'rgba(239, 68, 68, 0)', // transparent
        borderColor: 'rgb(239, 68, 68)', // red semantic for average
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(239, 68, 68)',
        borderWidth: 3,
      }
    ],
  };

  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 7,
        ticks: {
          stepSize: 1,
          backdropColor: 'transparent',
          color: 'rgba(0, 0, 0, 0.7)'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        pointLabels: {
          color: '#334155',
          font: {
            size: 12, // Reduced from 14 to give more space to the figure
            family: "'Inter', sans-serif",
            weight: 700
          },
          padding: 5 // Reduced padding
        }
      }
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom',
        labels: {
          color: '#334155',
          font: {
            size: 13, // Increased from 12
            family: "'Inter', sans-serif",
            weight: 'bold'
          },
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#334155',
        bodyColor: '#334155',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true
      }
    },
    layout: {
      padding: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }
    }
  };

  return (
    <div className="chart-container">
      <Radar data={data} options={options} />
    </div>
  );
}
