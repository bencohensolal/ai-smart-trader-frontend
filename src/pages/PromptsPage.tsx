import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PromptDefinition,
  PromptType,
  createPrompt,
  deletePrompt,
  isUnauthorizedError,
  listPrompts,
  resetDefaultPrompts,
  resetPromptToDefault,
  updatePrompt,
} from '../api';
import { InfoTip } from '../components/InfoTip';
import { useI18n } from '../i18n/i18n';
import { Layout } from '../components/Layout';

export function PromptsPage(): JSX.Element {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<PromptDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState<'success' | 'error'>('success');
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);

  const [type, setType] = useState<PromptType>('ai_advisor_system');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        setPrompts(await listPrompts());
        setStatus('');
      } catch (error) {
        if (isUnauthorizedError(error)) {
          navigate('/login', { replace: true });
          return;
        }
        setStatusKind('error');
        setStatus('Unable to load prompts.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [navigate]);

  const grouped = useMemo(() => {
    return {
      ai_advisor_system: prompts.filter((prompt) => {
        return prompt.type === 'ai_advisor_system';
      }),
      ai_advisor_user: prompts.filter((prompt) => {
        return prompt.type === 'ai_advisor_user';
      }),
      simulation_explainer: prompts.filter((prompt) => {
        return prompt.type === 'simulation_explainer';
      }),
    };
  }, [prompts]);

  async function handleSave(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      if (editingPromptId) {
        const payload = await updatePrompt(editingPromptId, {
          name,
          description,
          content,
        });
        setPrompts(payload.prompts);
        setStatusKind('success');
        setStatus('Prompt updated.');
      } else {
        const payload = await createPrompt({
          type,
          name,
          description,
          content,
        });
        setPrompts(payload.prompts);
        setStatusKind('success');
        setStatus('Prompt created.');
      }
      resetForm();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        navigate('/login', { replace: true });
        return;
      }
      setStatusKind('error');
      setStatus('Unable to save this prompt.');
    }
  }

  async function handleDelete(prompt: PromptDefinition): Promise<void> {
    const confirmed = window.confirm(`Delete prompt "${prompt.name}"?`);
    if (!confirmed) {
      return;
    }
    try {
      const payload = await deletePrompt(prompt.id);
      setPrompts(payload.prompts);
      setStatusKind('success');
      setStatus('Prompt deleted.');
      if (editingPromptId === prompt.id) {
        resetForm();
      }
    } catch (error) {
      if (isUnauthorizedError(error)) {
        navigate('/login', { replace: true });
        return;
      }
      setStatusKind('error');
      setStatus('Unable to delete this prompt.');
    }
  }

  async function handleResetPrompt(prompt: PromptDefinition): Promise<void> {
    try {
      const payload = await resetPromptToDefault(prompt.id);
      setPrompts(payload.prompts);
      setStatusKind('success');
      setStatus('Prompt reset to default version.');
      if (editingPromptId === prompt.id) {
        setName(payload.updated.name);
        setDescription(payload.updated.description);
        setContent(payload.updated.content);
      }
    } catch (error) {
      if (isUnauthorizedError(error)) {
        navigate('/login', { replace: true });
        return;
      }
      setStatusKind('error');
      setStatus('Unable to restore this prompt.');
    }
  }

  async function handleResetDefaults(typeToReset?: PromptType): Promise<void> {
    const confirmed = window.confirm(
      typeToReset ? 'Reset default prompts for this type?' : 'Reset all default prompts?',
    );
    if (!confirmed) {
      return;
    }
    try {
      const payload = await resetDefaultPrompts(typeToReset);
      setPrompts(payload.prompts);
      setStatusKind('success');
      setStatus('Default prompts restored.');
      resetForm();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        navigate('/login', { replace: true });
        return;
      }
      setStatusKind('error');
      setStatus('Unable to reset prompts.');
    }
  }

  function startEdit(prompt: PromptDefinition): void {
    setEditingPromptId(prompt.id);
    setType(prompt.type);
    setName(prompt.name);
    setDescription(prompt.description);
    setContent(prompt.content);
    setStatus('');
  }

  function resetForm(): void {
    setEditingPromptId(null);
    setType('ai_advisor_system');
    setName('');
    setDescription('');
    setContent('');
  }

  return (
    <Layout title={t('page.prompts.title')} subtitle={t('page.prompts.subtitle')}>
      <section className="prompts-grid">
        <article className="panel">
          <h2>{editingPromptId ? 'Edit prompt' : 'New prompt'}</h2>
          <p>You can create multiple prompts per type to compare algorithm behaviors.</p>
          <form
            className="strategy-form strategy-form--stacked"
            onSubmit={(event) => void handleSave(event)}
          >
            <div className="form-grid">
              <label className="field">
                <span className="field-label">
                  Prompt type
                  <InfoTip
                    label="Type"
                    text="Each type maps to a different business usage (AI system, AI context, simulation explanation...)."
                  />
                </span>
                <select
                  value={type}
                  onChange={(event) => {
                    setType(event.target.value as PromptType);
                  }}
                  disabled={Boolean(editingPromptId)}
                >
                  <option value="ai_advisor_system">AI Advisor - System</option>
                  <option value="ai_advisor_user">AI Advisor - Context</option>
                  <option value="simulation_explainer">Simulation - Explanation</option>
                </select>
              </label>

              <label className="field">
                <span className="field-label">Name</span>
                <input
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                  }}
                  placeholder="Ex: Cautious AI / anti-overtrading"
                  required
                />
              </label>

              <label className="field">
                <span className="field-label">Description</span>
                <input
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                  }}
                  placeholder="This prompt limits overly aggressive selling"
                  required
                />
              </label>
            </div>

            <label className="field">
              <span className="field-label">
                Prompt content
                <InfoTip
                  label="Placeholder"
                  text="For AI context prompts, use {{contextJson}} to inject cycle data automatically."
                />
              </span>
              <textarea
                rows={10}
                value={content}
                onChange={(event) => {
                  setContent(event.target.value);
                }}
                placeholder="Ex: Analyze this context and respond in JSON..."
                required
              />
            </label>

            <div className="form-actions">
              <button className="button" type="submit">
                {editingPromptId ? 'Save' : 'Create'}
              </button>
              <button className="button button-secondary" type="button" onClick={resetForm}>
                Reset form
              </button>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => {
                  void handleResetDefaults();
                }}
              >
                Restore all defaults
              </button>
            </div>
          </form>
        </article>

        <aside className="panel">
          <h2>Quick help</h2>
          <ul className="cards-list">
            <li>
              <h3>Multiple variants</h3>
              <p>Create multiple prompts of the same type for A/B testing.</p>
            </li>
            <li>
              <h3>Default version</h3>
              <p>Prompts shipped with the project remain available and can be restored.</p>
            </li>
            <li>
              <h3>Strategy setup</h3>
              <p>Each strategy can choose its AI prompts in the Strategies page.</p>
            </li>
          </ul>
        </aside>
      </section>

      <section className="panel">
        <h2>Prompt library</h2>
        {loading ? <p>Loading...</p> : null}

        {(['ai_advisor_system', 'ai_advisor_user', 'simulation_explainer'] as const).map(
          (promptType) => {
            const list = grouped[promptType];
            return (
              <article className="sub-panel" key={promptType}>
                <div className="sub-panel-head">
                  <h3>{formatPromptType(promptType)}</h3>
                  <button
                    className="button button-secondary button-small"
                    type="button"
                    onClick={() => {
                      void handleResetDefaults(promptType);
                    }}
                  >
                    Restore defaults ({formatPromptType(promptType)})
                  </button>
                </div>
                <div className="table-scroll table-scroll-wide">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Default</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((prompt) => {
                        return (
                          <tr key={prompt.id}>
                            <td>{prompt.id}</td>
                            <td>{prompt.name}</td>
                            <td>{prompt.description}</td>
                            <td>{prompt.isDefault ? 'yes' : 'no'}</td>
                            <td>
                              <div className="table-actions">
                                <button
                                  className="button button-secondary button-small"
                                  type="button"
                                  onClick={() => {
                                    startEdit(prompt);
                                  }}
                                >
                                  Edit
                                </button>
                                {prompt.templateKey ? (
                                  <button
                                    className="button button-secondary button-small"
                                    type="button"
                                    onClick={() => {
                                      void handleResetPrompt(prompt);
                                    }}
                                  >
                                    Reset to default
                                  </button>
                                ) : (
                                  <button
                                    className="button button-danger button-small"
                                    type="button"
                                    onClick={() => {
                                      void handleDelete(prompt);
                                    }}
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </article>
            );
          },
        )}
      </section>

      {status ? (
        <section
          className={`panel status ${statusKind === 'error' ? 'status-error' : 'status-success'}`}
        >
          {status}
        </section>
      ) : null}
    </Layout>
  );
}

function formatPromptType(type: PromptType): string {
  if (type === 'ai_advisor_system') {
    return 'AI Advisor - System';
  }
  if (type === 'ai_advisor_user') {
    return 'AI Advisor - Context';
  }
  return 'Simulation - Explanation';
}
