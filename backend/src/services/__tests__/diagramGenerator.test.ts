import { describe, it, expect } from 'vitest';
import { DiagramGenerator } from '../diagramGenerator';
import { RepoSummary } from '../../types';

describe('DiagramGenerator', () => {
  const generator = new DiagramGenerator();

  const mockSummary: RepoSummary = {
    name: 'test-project',
    language: 'TypeScript',
    packageManager: 'npm',
    framework: 'Fastify',
    entrypoints: ['src/index.ts'],
    modules: [
      {
        path: 'src/controllers/userController.ts',
        name: 'userController',
        type: 'controller',
        exports: ['getUsers', 'createUser'],
        imports: ['../services/userService'],
      },
      {
        path: 'src/services/userService.ts',
        name: 'userService',
        type: 'service',
        exports: ['UserService'],
        imports: ['../models/user'],
      },
      {
        path: 'src/models/user.ts',
        name: 'user',
        type: 'model',
        exports: ['User'],
        imports: [],
      },
    ],
    dependencies: {
      production: {
        fastify: '^4.0.0',
        prisma: '^5.0.0',
      },
      development: {
        typescript: '^5.0.0',
        vitest: '^1.0.0',
      },
      graph: [
        { name: 'fastify', dependsOn: [] },
        { name: 'prisma', dependsOn: [] },
      ],
    },
    fileStructure: {
      name: 'test-project',
      path: 'test-project',
      type: 'directory',
      children: [],
    },
  };

  describe('generatePlantUML', () => {
    it('should generate valid PlantUML syntax', () => {
      const result = generator.generatePlantUML(mockSummary);

      expect(result).toContain('@startuml');
      expect(result).toContain('@enduml');
      expect(result).toContain('title test-project');
    });

    it('should include all module types', () => {
      const result = generator.generatePlantUML(mockSummary);

      expect(result).toContain('Controllers');
      expect(result).toContain('Services');
      expect(result).toContain('Models');
    });

    it('should include module names', () => {
      const result = generator.generatePlantUML(mockSummary);

      expect(result).toContain('[userController]');
      expect(result).toContain('[userService]');
      expect(result).toContain('[user]');
    });
  });

  describe('generateGraphvizDot', () => {
    it('should generate valid Graphviz DOT syntax', () => {
      const result = generator.generateGraphvizDot(mockSummary);

      expect(result).toContain('digraph Dependencies');
      expect(result).toContain('rankdir=LR');
      expect(result).toMatch(/}\s*$/); // Should end with closing brace
    });

    it('should include project name as main node', () => {
      const result = generator.generateGraphvizDot(mockSummary);

      expect(result).toContain('"test-project"');
    });

    it('should include production dependencies', () => {
      const result = generator.generateGraphvizDot(mockSummary);

      expect(result).toContain('"fastify"');
      expect(result).toContain('"prisma"');
    });

    it('should differentiate between production and dev dependencies', () => {
      const result = generator.generateGraphvizDot(mockSummary);

      // Production deps should have solid lines
      expect(result).toContain('"test-project" -> "fastify"');

      // Dev deps should have dashed lines
      expect(result).toContain('[style=dashed]');
    });
  });

  describe('generateComponentDiagram', () => {
    it('should generate valid PlantUML component diagram', () => {
      const result = generator.generateComponentDiagram(mockSummary);

      expect(result).toContain('@startuml');
      expect(result).toContain('@enduml');
      expect(result).toContain('component');
    });

    it('should group components by type', () => {
      const result = generator.generateComponentDiagram(mockSummary);

      expect(result).toContain('package "controller"');
      expect(result).toContain('package "service"');
      expect(result).toContain('package "model"');
    });
  });
});
