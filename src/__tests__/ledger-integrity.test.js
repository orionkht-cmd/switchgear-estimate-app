import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectFormModal from '../components/ProjectFormModal';

// Mock the onSave and onClose functions
const mockOnSave = jest.fn();
const mockOnClose = jest.fn();

// Sample Initial Data
const initialProjectForm = {
  ledgerName: '',
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

describe('Ledger Data Integrity Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all form fields correctly', () => {
    render(
      <ProjectFormModal
        isOpen={true}
        isEditMode={false}
        projectForm={initialProjectForm}
        setProjectForm={() => {}}
        companiesList={['Company A', 'Company B']}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('신규 프로젝트 등록')).toBeInTheDocument();
    expect(screen.getByText('소속 대장 (회사 선택)')).toBeInTheDocument();
    expect(screen.getByText('프로젝트 번호')).toBeInTheDocument();
    expect(screen.getByText('사업명')).toBeInTheDocument();
    expect(screen.getByText('납품기한')).toBeInTheDocument();
    expect(screen.getByText('준공기한')).toBeInTheDocument();
    expect(screen.getByText('계약번호')).toBeInTheDocument();
    expect(screen.getByText('품명')).toBeInTheDocument();
    expect(screen.getByText('견적금액 (VAT포함)')).toBeInTheDocument();
  });

  test('preserves exact user input for critical fields (Data Fidelity)', async () => {
    // We need a wrapper to manage state for the controlled inputs similar to the real app
    const Wrapper = () => {
      const [form, setForm] = React.useState(initialProjectForm);
      return (
        <ProjectFormModal
          isOpen={true}
          isEditMode={false}
          projectForm={form}
          setProjectForm={setForm}
          companiesList={['Company A', 'Company B']}
          onSave={() => mockOnSave(form)} // Pass the current state to the mock
          onClose={mockOnClose}
        />
      );
    };

    // React is needed for useState in the wrapper
    const React = require('react');
    render(<Wrapper />);

    const user = userEvent.setup();

    // 1. Enter a large amount and ensure it's not formatted or rounded
    const amountInput = screen.getByPlaceholderText('0');
    const testAmount = '1234567890'; // 1.2 billion
    await user.type(amountInput, testAmount);
    expect(amountInput).toHaveValue(Number(testAmount)); // Input type="number" stores as number usually, but value checking

    // 2. Enter Project Name with special characters
    const nameInput = screen.getByLabelText('사업명');
    await user.type(nameInput, 'Project #1 (Special_Char)');
    expect(nameInput).toHaveValue('Project #1 (Special_Char)');

    // 3. Select Company
    const companySelect = screen.getByLabelText('소속 대장 (회사 선택)');
    expect(companySelect).toBeInTheDocument();
    
    // Let's verify saving
    const saveButton = screen.getByText('등록');
    await user.click(saveButton);

    // Verify the mock was called with the data we entered
    expect(mockOnSave).toHaveBeenCalled();
    const savedData = mockOnSave.mock.calls[0][0];
    
    // Critical: Verify Data Fidelity
    expect(savedData.contractAmount).toBe(testAmount); // Should match exact string input if that's what we typed
    expect(savedData.name).toBe('Project #1 (Special_Char)');
  });

  test('Project ID is preserved exactly', async () => {
        const Wrapper = () => {
      const [form, setForm] = React.useState(initialProjectForm);
      return (
        <ProjectFormModal
          isOpen={true}
          isEditMode={false}
          projectForm={form}
          setProjectForm={setForm}
          companiesList={['Company A', 'Company B']}
          onSave={() => mockOnSave(form)}
          onClose={mockOnClose}
        />
      );
    };
    const React = require('react');
    render(<Wrapper />);
    const user = userEvent.setup();

    const idInput = screen.getByLabelText('프로젝트 번호');
    
    const testId = '2024-TEST-001-A';
    await user.type(idInput, testId);
    
    expect(idInput).toHaveValue(testId);
    
    await user.click(screen.getByText('등록'));
    expect(mockOnSave.mock.calls[lastCallIndex(mockOnSave)][0].projectIdDisplay).toBe(testId);
  });
});

// Helper
function lastCallIndex(mock) {
  return mock.mock.calls.length - 1;
}
