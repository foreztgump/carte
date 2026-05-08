import { useState, type ReactElement } from "react";

import type {
  ModifierGroupContract,
  ModifierUpdateRequest,
  ModifierUpdateResponse,
} from "@carte/core/contracts";
import { ordersBackendRoutes } from "@carte/core/contracts";

import { formatMoney, ORDERS_BACKEND_BASE_PATH } from "../admin/order-utils.js";

const NESTED_GROUP_ERROR = "Nested modifier groups are not supported in Carte v0.1.";
const DEFAULT_DRAFT = { groupName: "", nestedGroup: "", optionFeeCents: "0", optionName: "" };

type ModifierDraft = typeof DEFAULT_DRAFT;

type ModifierGroupFormProps = {
  backendBasePath?: string;
  initialGroups?: ModifierGroupContract[];
};

export const ModifierGroupForm = ({
  backendBasePath = ORDERS_BACKEND_BASE_PATH,
  initialGroups = [],
}: ModifierGroupFormProps): ReactElement => {
  const [groups, setGroups] = useState(initialGroups);
  const [draft, setDraft] = useState(DEFAULT_DRAFT);
  const [error, setError] = useState("");

  const saveGroups = (nextGroups: ModifierGroupContract[]): void => {
    setGroups(nextGroups);
    setError("");
    persistGroups(backendBasePath, nextGroups).catch(() =>
      setError("Could not save modifier groups. Try again."),
    );
  };

  const createGroup = (): void => {
    const result = buildModifierGroup(draft, groups.length);
    if (typeof result === "string") {
      setError(result);
      return;
    }
    saveGroups([...groups, result]);
    setDraft(DEFAULT_DRAFT);
  };

  return (
    <section aria-label="Modifier group editor">
      <ModifierDraftFields draft={draft} onChange={setDraft} />
      <button type="button" onClick={createGroup}>
        Create modifier group
      </button>
      {error ? (
        <p aria-live="assertive" role="alert">
          {error}
        </p>
      ) : null}
      <ModifierGroupList groups={groups} onChange={saveGroups} />
    </section>
  );
};

type DraftFieldsProps = {
  draft: ModifierDraft;
  onChange: (draft: ModifierDraft) => void;
};

const ModifierDraftFields = ({ draft, onChange }: DraftFieldsProps): ReactElement => (
  <fieldset>
    <legend>New modifier group</legend>
    <DraftInput
      label="Modifier group name"
      value={draft.groupName}
      onChange={updateGroupName(draft, onChange)}
    />
    <DraftInput
      label="Option name"
      value={draft.optionName}
      onChange={updateOptionName(draft, onChange)}
    />
    <DraftInput
      label="Option fee in cents"
      type="number"
      value={draft.optionFeeCents}
      onChange={updateOptionFee(draft, onChange)}
    />
    <label>
      Nested modifier group JSON
      <textarea
        value={draft.nestedGroup}
        onChange={(event) => onChange({ ...draft, nestedGroup: event.currentTarget.value })}
      />
    </label>
  </fieldset>
);

type DraftInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "number" | "text";
};

const DraftInput = ({ label, onChange, type = "text", value }: DraftInputProps): ReactElement => (
  <label>
    {label}
    <input type={type} value={value} onChange={(event) => onChange(event.currentTarget.value)} />
  </label>
);

type GroupListProps = {
  groups: ModifierGroupContract[];
  onChange: (groups: ModifierGroupContract[]) => void;
};

const ModifierGroupList = ({ groups, onChange }: GroupListProps): ReactElement => {
  if (groups.length === 0) {
    return <p>No modifier groups configured yet.</p>;
  }
  return (
    <ul aria-label="Modifier groups">
      {groups.map((group) => (
        <ModifierGroupEditor group={group} groups={groups} key={group.id} onChange={onChange} />
      ))}
    </ul>
  );
};

type GroupEditorProps = {
  group: ModifierGroupContract;
  groups: ModifierGroupContract[];
  onChange: (groups: ModifierGroupContract[]) => void;
};

const ModifierGroupEditor = ({ group, groups, onChange }: GroupEditorProps): ReactElement => {
  const [name, setName] = useState(group.name);
  const [feeCents, setFeeCents] = useState(String(group.options[0]?.feeCents ?? 0));
  const option = group.options[0];
  const saveGroup = (): void =>
    onChange(updateGroup(groups, { feeCents, groupId: group.id, name }));
  const deleteGroup = (): void => onChange(groups.filter((candidate) => candidate.id !== group.id));

  return (
    <li>
      <strong>{group.name}</strong>
      {option ? <p>{`${option.name} · ${formatMoney(option.feeCents)}`}</p> : null}
      <DraftInput label={`Edit ${group.name} name`} value={name} onChange={setName} />
      {option ? (
        <DraftInput
          label={`Edit ${option.name} fee in cents`}
          type="number"
          value={feeCents}
          onChange={setFeeCents}
        />
      ) : null}
      <button type="button" onClick={saveGroup}>
        Save {group.name}
      </button>
      <button type="button" onClick={deleteGroup}>
        Delete {group.name}
      </button>
    </li>
  );
};

const buildModifierGroup = (
  draft: ModifierDraft,
  index: number,
): ModifierGroupContract | string => {
  if (draft.nestedGroup.trim()) {
    return NESTED_GROUP_ERROR;
  }
  if (!draft.groupName.trim() || !draft.optionName.trim()) {
    return "Modifier group and option names are required.";
  }
  return {
    id: `modifier-group-${index + 1}`,
    name: draft.groupName.trim(),
    options: [
      {
        feeCents: parseFeeCents(draft.optionFeeCents),
        id: `modifier-option-${index + 1}`,
        name: draft.optionName.trim(),
      },
    ],
  };
};

type GroupUpdate = {
  feeCents: string;
  groupId: string;
  name: string;
};

const updateGroup = (
  groups: ModifierGroupContract[],
  update: GroupUpdate,
): ModifierGroupContract[] =>
  groups.map((group) =>
    group.id === update.groupId
      ? {
          ...group,
          name: update.name.trim(),
          options: updateOptionFees(group, update.feeCents),
        }
      : group,
  );

const updateOptionFees = (
  group: ModifierGroupContract,
  feeCents: string,
): ModifierGroupContract["options"] =>
  group.options.map((option) => ({ ...option, feeCents: parseFeeCents(feeCents) }));

const persistGroups = async (
  backendBasePath: string,
  groups: ModifierGroupContract[],
): Promise<void> => {
  const request: ModifierUpdateRequest = { groups };
  await postJson<ModifierUpdateRequest, ModifierUpdateResponse>(
    `${backendBasePath}${ordersBackendRoutes.modifierUpdate}`,
    request,
  );
};

const postJson = async <Request, Response>(url: string, body: Request): Promise<Response> => {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Request failed for ${url}`);
  }
  return (await response.json()) as Response;
};

const parseFeeCents = (value: string): number => Math.max(0, Number.parseInt(value, 10) || 0);

const updateGroupName =
  (draft: ModifierDraft, onChange: (draft: ModifierDraft) => void) => (groupName: string) =>
    onChange({ ...draft, groupName });

const updateOptionName =
  (draft: ModifierDraft, onChange: (draft: ModifierDraft) => void) => (optionName: string) =>
    onChange({ ...draft, optionName });

const updateOptionFee =
  (draft: ModifierDraft, onChange: (draft: ModifierDraft) => void) => (optionFeeCents: string) =>
    onChange({ ...draft, optionFeeCents });
