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
  attachedFiles: [],
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

  test('shows selected PDF and ZIP attachments and allows removing them', () => {
    render(<TestWrapper />);

    const attachmentInput = screen.getByLabelText(/PDF \/ 압축파일/);
    const pdf = new File(['sample'], '도면.pdf', { type: 'application/pdf' });
    const zip = new File(['sample'], '견적자료.zip', { type: 'application/zip' });

    fireEvent.change(attachmentInput, {
      target: { files: [pdf, zip] },
    });

    expect(screen.getByText('도면.pdf')).toBeInTheDocument();
    expect(screen.getByText('견적자료.zip')).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('삭제')[0]);

    expect(screen.queryByText('도면.pdf')).not.toBeInTheDocument();
    expect(screen.getByText('견적자료.zip')).toBeInTheDocument();
  });
});
