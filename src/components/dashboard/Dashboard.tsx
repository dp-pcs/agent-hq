
import React from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { Session } from '../../types';

const Dashboard: React.FC = () => {
  const { sessions } = useSessionStore();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Claude Code Dashboard</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-hq-bg-dark border border-hq-border">
          <thead>
            <tr className="bg-hq-bg-light">
              <th className="px-6 py-3 border-b border-hq-border text-left text-xs font-medium text-hq-text-secondary uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 border-b border-hq-border text-left text-xs font-medium text-hq-text-secondary uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-3 border-b border-hq-border text-left text-xs font-medium text-hq-text-secondary uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 border-b border-hq-border"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hq-border">
            {sessions.map((session: Session) => (
              <tr key={session.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-hq-text">
                  {session.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-hq-text-secondary">
                  {session.workspaceName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      session.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : session.status === 'idle'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {session.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    className="text-indigo-600 hover:text-indigo-900"
                    onClick={() => window.electronAPI.connectToSession(session.id)}
                  >
                    Connect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
