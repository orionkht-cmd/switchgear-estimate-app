import React from 'react';
import { formatCurrency } from '../../utils/format';

const PrintTemplate = ({ project }) => (
    <div className="hidden print:block p-8 max-w-[210mm] mx-auto bg-white">
        <div className="text-center mb-8 pb-4 border-b-2 border-black">
            <h1 className="text-3xl font-bold mb-2">견 적 서 / 관 리 카 드</h1>
            <p className="text-sm text-gray-600">
                문서번호: {project.projectIdDisplay}
            </p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
                <h3 className="font-bold border-b border-black mb-2 pb-1">
                    프로젝트 정보
                </h3>
                <table className="w-full text-sm">
                    <tbody>
                        <tr>
                            <td className="py-1 text-gray-500 w-24">프로젝트명</td>
                            <td className="font-bold">{project.name}</td>
                        </tr>
                        <tr>
                            <td className="py-1 text-gray-500">발주처</td>
                            <td>{project.client}</td>
                        </tr>
                        <tr>
                            <td className="py-1 text-gray-500">소속대장</td>
                            <td>{project.ledgerName}</td>
                        </tr>
                        <tr>
                            <td className="py-1 text-gray-500">담당자</td>
                            <td>
                                {project.salesRep} (영업) / {project.manager} (설계)
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div>
                <h3 className="font-bold border-b border-black mb-2 pb-1">
                    계약 정보
                </h3>
                <table className="w-full text-sm">
                    <tbody>
                        <tr>
                            <td className="py-1 text-gray-500 w-24">견적금액</td>
                            <td className="font-bold text-lg">
                                {formatCurrency(project.contractAmount)}
                            </td>
                        </tr>
                        <tr>
                            <td className="py-1 text-gray-500">계약방법</td>
                            <td>{project.contractMethod}</td>
                        </tr>
                        <tr>
                            <td className="py-1 text-gray-500">상태</td>
                            <td>{project.status}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div className="mb-8">
            <h3 className="font-bold border-b border-black mb-2 pb-1">
                견적 변경 이력
            </h3>
            <table className="w-full text-sm border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border border-gray-300 p-2">Rev</th>
                        <th className="border border-gray-300 p-2">날짜</th>
                        <th className="border border-gray-300 p-2">내용</th>
                        <th className="border border-gray-300 p-2 text-right">금액</th>
                    </tr>
                </thead>
                <tbody>
                    {[...(project.revisions || [])].reverse().map((rev, idx) => (
                        <tr key={idx}>
                            <td className="border border-gray-300 p-2 text-center">
                                {rev.rev}
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                                {rev.date}
                            </td>
                            <td className="border border-gray-300 p-2">{rev.note}</td>
                            <td className="border border-gray-300 p-2 text-right">
                                {formatCurrency(rev.amount)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="mt-16 flex justify-end gap-16">
            <div className="text-center">
                <p className="mb-16 text-sm">작성자</p>
                <p className="font-bold border-t border-black pt-2 w-32">
                    {project.manager}
                </p>
            </div>
            <div className="text-center">
                <p className="mb-16 text-sm">승인자</p>
                <p className="font-bold border-t border-black pt-2 w-32">(인)</p>
            </div>
        </div>

        <div className="mt-8 text-xs text-gray-400 text-center">
            출력일시: {new Date().toLocaleString()}
        </div>
    </div>
);

export default PrintTemplate;
