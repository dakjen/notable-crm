import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { STAGES, STAGE_STYLES, getTierClass } from '../data/constants';
import AddClientModal from '../components/AddClientModal';

const COL_CLASSES = ['pcol-lead', 'pcol-disc', 'pcol-active', 'pcol-review', 'pcol-done'];

export default function Pipeline() {
  const { clients } = useApp();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="page-content">
      <div className="section-header">
        <div className="section-title">Client Pipeline</div>
        <button className="btn" onClick={() => setShowAdd(true)}>+ Add Client</button>
      </div>

      <div className="pipeline-board">
        {STAGES.map((stage, si) => {
          const stageClients = clients.filter(c => c.stage === stage);
          return (
            <div key={stage}>
              <div className={`pipeline-col-header ${COL_CLASSES[si]}`}>
                {stage} ({stageClients.length})
              </div>
              {stageClients.length === 0 && (
                <div className="pipeline-empty">No clients</div>
              )}
              {stageClients.map(c => (
                <div
                  key={c.id}
                  className="pipeline-card"
                  onClick={() => navigate(`/clients/${c.id}`)}
                >
                  <div className="pipeline-card-name">{c.firstName} {c.lastName}</div>
                  <span className={`tier-tag ${getTierClass(c.tier)}`} style={{ fontSize: 8, padding: '1px 5px' }}>
                    {c.tier.length > 18 ? c.tier.slice(0, 18) + '…' : c.tier}
                  </span>
                  {c.value && <div className="pipeline-card-amt">{c.value}</div>}
                  <div className="pipeline-card-date">Added {c.added}</div>
                </div>
              ))}
              {stage !== 'Complete' && (
                <button className="pipeline-add-btn" onClick={() => setShowAdd(true)}>+ Add</button>
              )}
            </div>
          );
        })}
      </div>

      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
