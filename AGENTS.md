# Powwow development

Follow the model qualification process in `docs/model-quality-policy.md` when changing any AI experience.

- Basic is the least expensive evaluated model/workflow that meets that component's quality bar. Different components may require different baselines.
- Repeated failure of a core representative task is evidence to test a stronger model. Do not conceal that limitation with invented results, repeated repair calls, or silent downgrades.
- Keep candidate status explicit until live evaluation and product-owner review pass. Fixture tests verify software behavior, not AI quality.
- Preserve server-side budget enforcement, model provenance, and idempotency. Never automatically repeat a paid request when submission or billing is uncertain.
- Keep API credentials in ignored server configuration. Never expose them through browser variables, logs, screenshots, or test reports.
