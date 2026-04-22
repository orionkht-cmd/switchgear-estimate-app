import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ProjectFormModal from '../components/ProjectFormModal';

const baseProjectForm = {
  ledgerName: 'Company A',
  projectIdDisplay: '',
  name: '',
  client: '',
  estimateDate: '',
  deliveryDeadline: '',
  completionDeadline: '',
  contractNumber: '',
  productType: '수배전반',
  orderingDepartment: '',
  salesRep: '',
  manager: '',
  contractAmount: '',
  contractMethod: '수의계약',
};

function TestWrapper(props) {
  const [form, setForm] = React.useState(baseProjectForm);

  return (
    <ProjectFormModal
      isOpen={true}
      isEditMode={false}
      projectForm={form}
      setProjectForm={setForm}
      companiesList={['Company A']}
      onSave={jest.fn()}
      onClose={jest.fn()}
      {...props}
    />
  );
}

describe('ProjectFormModal date shortcuts', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-22T09:30:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('fills estimate date with today when pressing Ctrl + ;', () => {
    render(<TestWrapper />);

    const estimateDateInput = screen.getByLabelText(/견적일/);
    fireEvent.keyDown(estimateDateInput, {
      key: ';',
      code: 'Semicolon',
      ctrlKey: true,
    });

    expect(estimateDateInput).toHaveValue('2026-04-22');
  });
});
